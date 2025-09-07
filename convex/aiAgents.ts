
// Fix: Import Convex function builders from './_generated/server'
import { action, internalAction, query, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { GoogleGenAI, Type } from "@google/genai";
import { ConvexError } from 'convex/values';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Client-Facing AI Agent: Customer Concierge ---
export const askConcierge = action({
    args: {
        clerkOrgId: v.string(),
        question: v.string(),
    },
    handler: async (ctx, args) => {
        const pricingModel = await ctx.runQuery(internal.pricing.getPricingModel, { clerkOrgId: args.clerkOrgId });
        if (!pricingModel) throw new ConvexError("Business information not found.");

        const services = pricingModel.services.map(s => `- ${s.name}: $${s.basePrice}`).join('\n');

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
                You are a friendly and helpful customer service agent for a vehicle detailing business.
                Your goal is to answer the user's question concisely based on the services offered.
                Do not answer questions that are not related to vehicle detailing.

                Available Services:
                ${services}

                User's Question: "${args.question}"
            `,
        });

        return response.text;
    }
});

// --- Detailer-Facing AI Agent: Business Optimizer ---
export const generateBusinessInsights = internalAction({
    args: { 
        clerkOrgId: v.string(),
        pricingModel: v.any(), // Passed from analytics job
    },
    handler: async (ctx, { clerkOrgId, pricingModel }) => {
        const metrics = await ctx.runQuery(api.analytics.getDashboardMetrics, { clerkOrgId });
        if (!metrics) {
            console.log(`Skipping insight generation for ${clerkOrgId} due to no metrics.`);
            return;
        }

        const servicesText = pricingModel.services.map((s: any) => `- ${s.name}: $${s.basePrice}`).join('\n');

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
                You are a business optimization expert for a vehicle detailing company.
                Based on the following data, provide one short, actionable insight as a JSON object.
                If you suggest a pricing change, set type to 'pricing' and provide actionDetails with serviceName and newPrice.
                Otherwise, set type to 'marketing' or 'operations' and actionDetails to null.
                
                The newPrice should be a sensible adjustment (e.g., 5-15% increase) to an existing service. Choose one service to adjust.
                The title should be a short headline for the insight.
                The description should be a 1-2 sentence explanation.

                Data:
                - Total Revenue: $${metrics.totalRevenue.toFixed(2)}
                - Total Appointments: ${metrics.totalAppointments}
                - Average Rating: ${metrics.averageRating} / 5
                - Current Pricing:
                ${servicesText}
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        actionDetails: {
                            type: Type.OBJECT,
                            nullable: true,
                            properties: {
                                serviceName: { type: Type.STRING },
                                newPrice: { type: Type.NUMBER },
                            }
                        }
                    },
                    required: ["type", "title", "description"]
                }
            }
        });
        
        const insightObject = JSON.parse(response.text);

        // Save the new insight to the database
        await ctx.runMutation(internal.aiAgents.storeInsight, {
            clerkOrgId,
            insight: insightObject,
        });
    }
});

export const storeInsight = internalMutation({
    args: { 
        clerkOrgId: v.string(), 
        insight: v.object({
            type: v.string(),
            title: v.string(),
            description: v.string(),
            actionDetails: v.optional(v.any()),
        })
    },
    handler: async (ctx, args) => {
        // Optional: Delete old insights to keep the table clean
        const oldInsights = await ctx.db.query('aiInsights')
            .withIndex('by_clerk_org_id', q => q.eq('clerkOrgId', args.clerkOrgId))
            .collect();
        await Promise.all(oldInsights.map(insight => ctx.db.delete(insight._id)));

        // Insert the new one
        await ctx.db.insert('aiInsights', {
            clerkOrgId: args.clerkOrgId,
            insight: args.insight,
            generatedAt: Date.now(),
        });
    },
});

export const getLatestInsight = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.orgIds.includes(args.clerkOrgId)) {
            throw new ConvexError("Unauthorized");
        }
        return await ctx.db.query('aiInsights')
            .withIndex('by_clerk_org_id', q => q.eq('clerkOrgId', args.clerkOrgId))
            .order('desc')
            .first();
    },
});