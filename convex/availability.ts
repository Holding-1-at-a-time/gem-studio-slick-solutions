

import { query } from 'convex/server';
import { v } from 'convex/values';

/**
 * Public query to get available appointment slots for a tenant.
 */
// Fix: Use the 'query' factory function instead of the 'Query' type.
export const getAvailableSlots = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        const availability = await ctx.db
            .query("availability")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
            .unique();

        if (!availability) {
            return [];
        }
        
        // Filter out slots that are in the past
        const now = new Date().toISOString();
        return availability.availableSlots.filter(slot => slot > now);
    }
});
