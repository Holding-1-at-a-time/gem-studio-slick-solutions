

import { mutation, query } from 'convex/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';

// Fix: Use the 'mutation' factory function instead of the 'Mutation' type.
export const submitReview = mutation({
    args: {
        appointmentId: v.id('appointments'),
        rating: v.number(),
        comment: v.string(),
    },
    handler: async (ctx, args) => {
        const appointment = await ctx.db.get(args.appointmentId);
        if (!appointment) {
            throw new ConvexError("Appointment not found");
        }

        // Prevent duplicate reviews
        const existingReview = await ctx.db
            .query('reviews')
            .withIndex('by_appointment_id', q => q.eq('appointmentId', args.appointmentId))
            .unique();
        
        if (existingReview) {
            throw new ConvexError("A review for this appointment has already been submitted.");
        }
        
        // Basic validation
        if (args.rating < 1 || args.rating > 5) {
            throw new ConvexError("Rating must be between 1 and 5.");
        }

        await ctx.db.insert('reviews', {
            appointmentId: args.appointmentId,
            clerkOrgId: appointment.clerkOrgId,
            rating: args.rating,
            comment: args.comment,
            clientName: appointment.clientName.split(' ')[0], // Use first name for privacy
        });
    },
});


// Fix: Use the 'query' factory function instead of the 'Query' type.
export const getReviewsForTenant = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.orgIds.includes(args.clerkOrgId)) {
            throw new ConvexError("Unauthorized to view reviews.");
        }

        return await ctx.db
            .query('reviews')
            .withIndex('by_clerk_org_id', (q) => q.eq('clerkOrgId', args.clerkOrgId))
            .order('desc')
            .take(5); // Get the 5 most recent reviews for the dashboard
    },
});
