
import { mutation, internalQuery } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';

// Internal query to get the pricing model for a tenant.
// Used by other backend functions like assessment and AI agents.
export const getPricingModel = internalQuery({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => await ctx.db.query("pricingModels").withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId)).unique(),
});

// Mutation for a detailer to update a service price,
// often triggered by an AI suggestion.
export const updateServicePrice = mutation({
    args: {
        serviceName: v.string(),
        newPrice: v.number(),
    },
    handler: async (ctx, { serviceName, newPrice }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.orgId) {
            throw new ConvexError("Not authenticated or no active organization.");
        }
        
        // Basic validation
        if (newPrice <= 0) {
            throw new ConvexError("Price must be a positive number.");
        }

        const pricingModel = await ctx.db
            .query("pricingModels")
            .withIndex("by_clerk_org_id", q => q.eq("clerkOrgId", identity.orgId!))
            .unique();

        if (!pricingModel) {
            throw new ConvexError("Pricing model not found.");
        }

        const serviceIndex = pricingModel.services.findIndex(s => s.name === serviceName);
        if (serviceIndex === -1) {
            throw new ConvexError(`Service '${serviceName}' not found.`);
        }

        // Create a new services array with the updated price
        const updatedServices = [...pricingModel.services];
        updatedServices[serviceIndex] = { ...updatedServices[serviceIndex], basePrice: newPrice };
        
        // Patch the document
        await ctx.db.patch(pricingModel._id, { services: updatedServices });
    }
});