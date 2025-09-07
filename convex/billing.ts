
// Fix: Import Convex function builders from './_generated/server'
import { query, action, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable not set.");
}
const stripe = new Stripe(stripeSecretKey);


// Get the subscription status for the current user's organization
export const getSubscription = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) throw new Error("Not authenticated");

        // Basic authorization check
        if (!identity.orgIds.includes(args.clerkOrgId)) {
            return null;
        }

        return await ctx.db
            .query("subscriptions")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
            .unique();
    }
});

// Action to create a Stripe Billing Portal session
export const createStripePortalSession = action({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity || !identity.orgId) throw new Error("Not authenticated or no active organization");

        // In a real app, you would fetch the Stripe Customer ID associated with the organization
        // This could be stored on the tenant record.
        const mockStripeCustomerId = `cus_mock_${identity.orgId}`;

        try {
            // This is a placeholder as creating a customer is needed first.
            // In a real app, the `customer` ID would be real.
            // const portalSession = await stripe.billingPortal.sessions.create({
            //     customer: stripeCustomerId,
            //     return_url: `${process.env.HOSTING_URL}/dashboard`,
            // });
            // return { url: portalSession.url };
            
            console.log(`Simulating Stripe Portal Session for customer: ${mockStripeCustomerId}`);
            // Returning the base URL for demo purposes.
            return { url: `${process.env.HOSTING_URL}` };
        } catch (error) {
            console.error("Stripe Portal Session Error:", error);
            return { url: null };
        }
    }
});


// Internal mutation to update subscription status from a Stripe webhook
export const updateSubscription = internalMutation({
    args: {
        stripeSubscriptionId: v.string(),
        currentPeriodEnd: v.number(),
        plan: v.string(),
        status: v.string(),
    },
    handler: async (ctx, { stripeSubscriptionId, currentPeriodEnd, plan, status }) => {
        const sub = await ctx.db
            .query("subscriptions")
            .filter(q => q.eq(q.field("stripeSubscriptionId"), stripeSubscriptionId))
            .unique();

        if (!sub) {
            console.warn(`Subscription with ID ${stripeSubscriptionId} not found.`);
            return;
        }

        if (status === "active") {
             await ctx.db.patch(sub._id, {
                currentPeriodEnd,
                plan: plan as any,
                endsAt: undefined, // Clear cancellation date if reactivated
            });
        } else if (status === "canceled") {
            await ctx.db.patch(sub._id, {
                endsAt: currentPeriodEnd, // Mark that it will end, but don't delete yet
            });
        }
    }
});