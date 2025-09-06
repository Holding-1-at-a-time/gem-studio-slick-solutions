

import { action, internalAction, query, internalMutation } from 'convex/server';
import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import { GoogleGenAI } from "@google/genai";
import { ConvexError } from 'convex/values';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// --- Client-Facing AI Agent: Customer Concierge ---
// Fix: Use the 'action' factory function instead of the 'Action' type.
export const askConcierge = action({
    args: {
        clerkOrgId: v.string(),
        question: v.string(),
    },
    handler: async (ctx, args) => {
        const pricingModel = await ctx.runQuery(internal.assessments.getPricingModel, { clerkOrgId: args.clerkOrgId });
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
// Fix: Use the 'internalAction' factory function instead of the 'InternalAction' type.
export const generateBusinessInsights = internalAction({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, { clerkOrgId }) => {
        const metrics = await ctx.runQuery(api.analytics.getDashboardMetrics, { clerkOrgId });
        if (!metrics) {
            console.log(`Skipping insight generation for ${clerkOrgId} due to no metrics.`);
            return;
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `
                You are a business optimization expert for a vehicle detailing company.
                Based on the following data, provide one short, actionable insight (2 sentences max).
                Example: "Your average rating is high, consider promoting customer reviews on social media to attract new clients."
                
                Data:
                - Total Revenue: $${metrics.totalRevenue.toFixed(2)}
                - Total Appointments: ${metrics.totalAppointments}
                - Average Rating: ${metrics.averageRating} / 5
            `,
        });
        
        const insightText = response.text.trim();

        // Save the new insight to the database
        await ctx.runMutation(internal.aiAgents.storeInsight, {
            clerkOrgId,
            insight: insightText,
        });
    }
});

// Fix: Use the 'internalMutation' factory function instead of the 'InternalMutation' type.
export const storeInsight = internalMutation({
    args: { clerkOrgId: v.string(), insight: v.string() },
    handler: async (ctx, args) => {
        // Optional: Delete old insights to keep the table clean
        const oldInsights = await ctx.db.query('aiInsights')
            .withIndex('by_clerk_org_id', q => q.eq('clerkOrgId', args.clerkOrgId))
            .collect();
        await Promise.all(oldInsights.map(insight => ctx.db.delete(insight._id)));

        // Insert the new one
        await ctx.db.insert('aiInsights', {
            ...args,
            generatedAt: Date.now(),
        });
    },
});

// Fix: Use the 'query' factory function instead of the 'Query' type.
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
