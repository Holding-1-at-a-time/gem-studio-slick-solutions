

import { query, action, internalAction, internalQuery, internalMutation } from 'convex/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { internal } from './_generated/api';

// --- PUBLIC QUERIES (read from cache) ---

// Fix: Use the 'query' factory function instead of the 'Query' type.
export const getDashboardMetrics = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        const cache = await ctx.db.query('analyticsCache')
            .withIndex('by_clerk_org_id', q => q.eq('clerkOrgId', args.clerkOrgId))
            .unique();
        return cache ? cache.metrics : null;
    },
});

// Fix: Use the 'query' factory function instead of the 'Query' type.
export const getRevenueForecast = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        const cache = await ctx.db.query('analyticsCache')
            .withIndex('by_clerk_org_id', q => q.eq('clerkOrgId', args.clerkOrgId))
            .unique();
        return cache ? cache.metrics.revenueForecast : null;
    },
});

// --- PUBLIC ACTION (for on-demand tasks) ---

// Fix: Use the 'action' factory function instead of the 'Action' type.
export const generateClientReport = action({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.orgIds.includes(args.clerkOrgId)) {
            throw new ConvexError("Unauthorized to generate this report.");
        }
        
        const appointments = await ctx.runQuery(internal.analytics.getAppointmentsForReport, { clerkOrgId: args.clerkOrgId });

        // Generate CSV content
        const headers = ["AppointmentDate", "ClientName", "Vehicle", "Price", "Status"];
        const rows = appointments.map(appt => [
            new Date(appt.appointmentTime).toISOString().split('T')[0],
            `"${appt.clientName.replace(/"/g, '""')}"`, // Handle quotes in names
            `"${appt.vehicleDescription}"`,
            appt.price || 0,
            appt.status
        ].join(','));
        
        return [headers.join(','), ...rows].join('\n');
    }
});

// --- INTERNAL ACTIONS & QUERIES (for background jobs) ---

// Fix: Use the 'internalAction' factory function instead of the 'InternalAction' type.
export const calculateAndCacheMetrics = internalAction({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, { clerkOrgId }) => {
        // 1. Perform heavy calculations
        const appointments = await ctx.runQuery(internal.analytics.getAppointmentsForReport, { clerkOrgId });
        const reviews = await ctx.runQuery(internal.analytics.getReviewsForReport, { clerkOrgId });

        const totalRevenue = appointments.reduce((sum, appt) => sum + (appt.price || 0), 0);
        const totalAppointments = appointments.length;
        const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
        
        // 2. Simulate a predictive forecast for the next 3 months
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentMonth = new Date().getMonth();
        const revenueForecast = [...Array(3)].map((_, i) => {
            const monthIndex = (currentMonth + i + 1) % 12;
            const baseRevenue = totalRevenue / Math.max(1, totalAppointments) * 5; // Mock base
            const trend = (i + 1) * 0.1; // Upward trend
            const seasonality = Math.sin((monthIndex / 12) * Math.PI * 2) * 0.2 + 1; // Seasonal variation
            return {
                month: months[monthIndex],
                revenue: Math.max(0, baseRevenue * (1 + trend) * seasonality),
            };
        });

        const metrics = {
            totalRevenue,
            totalAppointments,
            averageRating: parseFloat(averageRating.toFixed(1)),
            revenueForecast,
        };

        // 3. Upsert the cache
        const existingCache = await ctx.runQuery(internal.analytics.getCache, { clerkOrgId });
        if (existingCache) {
            await ctx.runMutation(internal.analytics.updateCache, { id: existingCache._id, metrics });
        } else {
            await ctx.runMutation(internal.analytics.createCache, { clerkOrgId, metrics });
        }

        // 4. Trigger AI insight generation based on new data
        await ctx.scheduler.runAfter(0, internal.aiAgents.generateBusinessInsights, { clerkOrgId });
    }
});

// --- Internal helpers for the worker ---

// Fix: Use the 'internalQuery' factory function instead of the 'InternalQuery' type.
export const getAppointmentsForReport = internalQuery({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => await ctx.db.query('appointments').withIndex('by_clerk_org_id', q => q.eq('clerkOrgId', args.clerkOrgId)).collect(),
});

// Fix: Use the 'internalQuery' factory function instead of the 'InternalQuery' type.
export const getReviewsForReport = internalQuery({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => await ctx.db.query('reviews').withIndex('by_clerk_org_id', q => q.eq('clerkOrgId', args.clerkOrgId)).collect(),
});

// Fix: Use the 'internalQuery' factory function instead of the 'InternalQuery' type.
export const getCache = internalQuery({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => await ctx.db.query('analyticsCache').withIndex('by_clerk_org_id', q => q.eq('clerkOrgId', args.clerkOrgId)).unique(),
});

// Fix: Use the 'internalMutation' factory function instead of the 'InternalMutation' type.
export const createCache = internalMutation({
    args: { clerkOrgId: v.string(), metrics: v.any() },
    handler: async (ctx, args) => await ctx.db.insert('analyticsCache', { ...args, updatedAt: Date.now() }),
});

// Fix: Use the 'internalMutation' factory function instead of the 'InternalMutation' type.
export const updateCache = internalMutation({
    args: { id: v.id('analyticsCache'), metrics: v.any() },
    handler: async (ctx, args) => await ctx.db.patch(args.id, { metrics: args.metrics, updatedAt: Date.now() }),
});
