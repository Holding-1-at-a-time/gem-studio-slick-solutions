
import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';
// Fix: Import Convex function builders from './_generated/server'
import { internalAction } from './_generated/server';

const crons = cronJobs();

// Schedule a job to update analytics for all tenants every hour.
// This pre-calculates metrics for fast dashboard loading and generates fresh AI insights.
crons.interval(
  "Update Analytics and AI Insights",
  { hours: 1 }, // Run every hour
  internal.jobs.updateAllAnalytics,
);

/**
 * An internal action that kicks off the analytics calculation for all tenants.
 * This is the entry point for the cron job.
 */
export const updateAllAnalytics = internalAction({
  handler: async (ctx) => {
    // 1. Get all tenants from an internal query that doesn't require auth.
    const tenants = await ctx.runQuery(internal.tenants.listAllTenantsForInternalUse);

    // 2. For each tenant, schedule a background action to calculate and cache their metrics.
    for (const tenant of tenants) {
      await ctx.scheduler.runAfter(0, internal.analytics.calculateAndCacheMetrics, {
        clerkOrgId: tenant.clerkOrgId,
      });
    }
    
    console.log(`Scheduled analytics updates for ${tenants.length} tenants.`);
  },
});


export default crons;