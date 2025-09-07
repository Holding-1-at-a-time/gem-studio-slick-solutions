
// Fix: Import Convex function builders from './_generated/server'
import { mutation, internalAction, internalQuery, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { GoogleGenAI, Type } from "@google/genai";
import { RateLimiter } from "@convex-dev/rate-limiter";

// --- HELPERS ---

async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < retries; i++) {
        try { return await fn(); } catch (error) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed. Retrying in ${delay * (i + 1)}ms...`);
            await new Promise(res => setTimeout(res, delay * (i + 1)));
        }
    }
    throw lastError;
}

const estimateGenerationLimiter = new RateLimiter("estimateGeneration", [{ rate: 5, period: 60 }]);

// --- PUBLIC MUTATIONS & ACTIONS ---

export const submitAssessment = mutation({
    args: {
        clerkOrgId: v.string(), clientName: v.string(), clientEmail: v.string(),
        clientPhone: v.string(), vehicleYear: v.string(), vehicleMake: v.string(),
        vehicleModel: v.string(), vin: v.string(), conditionNotes: v.string(),
    },
    handler: async (ctx, args) => {
        const assessmentId = await ctx.db.insert("assessments", { ...args });
        await ctx.db.insert("estimateJobs", { assessmentId, status: "pending" });
        await ctx.scheduler.runAfter(0, internal.assessments.processEstimateJob, { assessmentId, clerkOrgId: args.clerkOrgId });
        return assessmentId;
    }
});

// --- WORKER (INTERNAL ACTION) ---

export const processEstimateJob = internalAction({
    args: {
        assessmentId: v.id("assessments"),
        clerkOrgId: v.string(),
    },
    handler: async (ctx, { assessmentId, clerkOrgId }) => {
        const job = await ctx.runQuery(internal.assessments.getJobByAssessmentId, { assessmentId });
        if (!job) throw new Error("Job not found for assessment.");
        const assessment = await ctx.runQuery(api.assessments.getAssessmentById, { id: assessmentId });
        if(!assessment) throw new Error("Could not find matching assessment to process job.");

        try {
            const { ok } = await estimateGenerationLimiter.check(ctx, clerkOrgId);
            if (!ok) {
                console.warn(`Rate limit exceeded for org ${clerkOrgId}. Job rescheduled.`);
                await ctx.scheduler.runAfter(60 * 1000, internal.assessments.processEstimateJob, { assessmentId, clerkOrgId });
                return;
            }

            await ctx.runMutation(internal.assessments.updateJobStatus, { jobId: job._id, status: "in_progress" });
            const estimate = await generateEstimateWithAI(ctx, assessment);

            await ctx.runMutation(internal.assessments.saveEstimate, {
                assessmentId: assessment._id, items: estimate.items, total: estimate.total,
                suggestedAddons: estimate.suggestedAddons,
            });

            await ctx.runMutation(internal.assessments.updateJobStatus, { jobId: job._id, status: "completed" });
        } catch (error) {
            console.error(`Failed to process job ${job._id}:`, error);
            await ctx.runMutation(internal.assessments.updateJobStatus, { jobId: job._id, status: "failed" });
        }
    },
});

async function generateEstimateWithAI(ctx: any, args: { clerkOrgId: string, vehicleYear: string, vehicleMake: string, vehicleModel: string, conditionNotes: string }) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey });

    const pricingModel = await ctx.runQuery(internal.pricing.getPricingModel, { clerkOrgId: args.clerkOrgId });
    if (!pricingModel) throw new Error(`Pricing model not found for tenant ${args.clerkOrgId}`);
    
    const basePricesText = pricingModel.services.map(s => `- ${s.name} (${s.description}): $${s.basePrice}`).join('\n');

    const generate = () => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
            You are an expert vehicle detailer's assistant. Generate an itemized estimate.
            1.  Adjust base prices up or down based on the condition notes.
            2.  Suggest 1-2 relevant add-on services from the base price list if the notes mention something specific (e.g., suggest 'Full Interior Shampoo' for "coffee stain"). These are suggestions, not part of the main estimate.
            3.  Provide a final total for the main estimate.

            Vehicle: ${args.vehicleYear} ${args.vehicleMake} ${args.vehicleModel}
            Condition Notes: "${args.conditionNotes}"
            Base Prices:
            ${basePricesText}
        `,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { description: { type: Type.STRING }, price: { type: Type.NUMBER } } } },
                    total: { type: Type.NUMBER },
                    suggestedAddons: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, price: { type: Type.NUMBER } } } },
                },
                required: ["items", "total"],
            },
        },
    });

    // Fix: Explicitly pass all arguments to the retry function to avoid a potential TypeScript inference issue.
    const response = await retry(generate, 3, 1000);
    return JSON.parse(response.text);
}


// --- INTERNAL HELPERS (QUERIES & MUTATIONS) ---

export const saveEstimate = internalMutation({
    args: {
        assessmentId: v.id("assessments"), items: v.array(v.object({ description: v.string(), price: v.number() })), total: v.number(),
        suggestedAddons: v.optional(v.array(v.object({ name: v.string(), description: v.string(), price: v.number() }))),
    },
    handler: async (ctx, args) => { await ctx.db.insert("estimates", { ...args }); },
});

export const updateJobStatus = internalMutation({
    args: { jobId: v.id("estimateJobs"), status: v.union(v.literal('pending'), v.literal('in_progress'), v.literal('completed'), v.literal('failed')) },
    handler: async (ctx, { jobId, status }) => { await ctx.db.patch(jobId, { status }); },
});

export const getJobByAssessmentId = internalQuery({
    args: { assessmentId: v.id("assessments") },
    handler: async (ctx, { assessmentId }) => await ctx.db.query("estimateJobs").withIndex("by_assessment_id", q => q.eq("assessmentId", assessmentId)).unique(),
});

// --- PUBLIC QUERIES ---

export const getEstimate = query({
    args: { assessmentId: v.id("assessments") },
    handler: async (ctx, args) => await ctx.db.query("estimates").withIndex("by_assessment_id", (q) => q.eq("assessmentId", args.assessmentId)).unique(),
});

export const getAssessmentById = query({
    args: { id: v.id("assessments") },
    handler: async (ctx, args) => await ctx.db.get(args.id),
});