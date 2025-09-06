

import { mutation, internalAction, internalQuery, query, internalMutation } from 'convex/server';
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

// Fix: Use the 'mutation' factory function instead of the 'Mutation' type.
export const submitAssessment = mutation({
    args: {
        clerkOrgId: v.string(), clientName: v.string(), clientEmail: v.string(),
        clientPhone: v.string(), vehicleYear: v.string(), vehicleMake: v.string(),
        vehicleModel: v.string(), vin: v.string(), conditionNotes: v.string(),
    },
    handler: async (ctx, args) => {
        const assessmentId = await ctx.db.insert("assessments", { ...args });
        await ctx.db.insert("estimateJobs", { assessmentId, status: "pending" });
        await ctx.scheduler.runAfter(0, internal.assessments.processEstimateJob, { assessmentData: args });
        return assessmentId;
    }
});

// --- WORKER (INTERNAL ACTION) ---

// Fix: Use the 'internalAction' factory function instead of the 'InternalAction' type.
export const processEstimateJob = internalAction({
    args: {
        assessmentData: v.object({
            clerkOrgId: v.string(), vehicleYear: v.string(), vehicleMake: v.string(),
            vehicleModel: v.string(), conditionNotes: v.string(),
        }),
    },
    handler: async (ctx, { assessmentData }) => {
        const { clerkOrgId } = assessmentData;
        const assessment = await ctx.runQuery(internal.assessments.getAssessmentByClerkOrgId, { clerkOrgId });
        if (!assessment) throw new Error("Could not find matching assessment to process job.");

        const job = await ctx.runQuery(internal.assessments.getJobByAssessmentId, { assessmentId: assessment._id });
        if (!job) throw new Error("Job not found for assessment.");

        try {
            // Fix: Pass context to the rate limiter and check for the `ok` property, not `success`.
            const { ok } = await estimateGenerationLimiter.check(ctx, clerkOrgId);
            if (!ok) {
                console.warn(`Rate limit exceeded for organization: ${clerkOrgId}. Job rescheduled.`);
                await ctx.scheduler.runAfter(60 * 1000, internal.assessments.processEstimateJob, { assessmentData });
                return;
            }

            await ctx.runMutation(internal.assessments.updateJobStatus, { jobId: job._id, status: "in_progress" });
            const estimate = await generateEstimateWithAI(ctx, assessmentData);

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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    const pricingModel = await ctx.runQuery(internal.assessments.getPricingModel, { clerkOrgId: args.clerkOrgId });
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

    const response = await retry(generate);
    return JSON.parse(response.text);
}


// --- INTERNAL HELPERS (QUERIES & MUTATIONS) ---

// Fix: Use the 'internalQuery' factory function instead of the 'InternalQuery' type.
export const getPricingModel = internalQuery({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => await ctx.db.query("pricingModels").withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId)).unique(),
});

// Fix: Use the 'internalMutation' factory function instead of the 'InternalMutation' type.
export const saveEstimate = internalMutation({
    args: {
        assessmentId: v.id("assessments"), items: v.array(v.object({ description: v.string(), price: v.number() })), total: v.number(),
        suggestedAddons: v.optional(v.array(v.object({ name: v.string(), description: v.string(), price: v.number() }))),
    },
    handler: async (ctx, args) => { await ctx.db.insert("estimates", { ...args }); },
});

// Fix: Use the 'internalMutation' factory function instead of the 'InternalMutation' type.
export const updateJobStatus = internalMutation({
    args: { jobId: v.id("estimateJobs"), status: v.union(v.literal('pending'), v.literal('in_progress'), v.literal('completed'), v.literal('failed')) },
    handler: async (ctx, { jobId, status }) => { await ctx.db.patch(jobId, { status }); },
});

// Fix: Use the 'internalQuery' factory function instead of the 'InternalQuery' type.
export const getJobByAssessmentId = internalQuery({
    args: { assessmentId: v.id("assessments") },
    handler: async (ctx, { assessmentId }) => await ctx.db.query("estimateJobs").withIndex("by_assessment_id", q => q.eq("assessmentId", assessmentId)).unique(),
});

// Fix: Use the 'internalQuery' factory function instead of the 'InternalQuery' type.
export const getAssessmentByClerkOrgId = internalQuery({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, { clerkOrgId }) => {
        // This is simplified; a real app would need a more robust way to link a job to the right assessment.
        return await ctx.db.query("assessments").filter(q => q.eq(q.field("clerkOrgId"), clerkOrgId)).order("desc").first();
    },
});

// --- PUBLIC QUERIES ---

// Fix: Use the 'query' factory function instead of the 'Query' type.
export const getEstimate = query({
    args: { assessmentId: v.id("assessments") },
    handler: async (ctx, args) => await ctx.db.query("estimates").withIndex("by_assessment_id", (q) => q.eq("assessmentId", args.assessmentId)).unique(),
});

// Fix: Use the 'query' factory function instead of the 'Query' type.
export const getAssessmentById = query({
    args: { id: v.id("assessments") },
    handler: async (ctx, args) => await ctx.db.get(args.id),
});
