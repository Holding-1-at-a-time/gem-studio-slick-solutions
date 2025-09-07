
import { httpRouter } from "convex/server";
// Fix: Import httpAction from './_generated/server'
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import type { WebhookEvent } from "@clerk/clerk-sdk-node";
import Stripe from 'stripe';

// --- Clerk Webhook Handler ---
const handleClerkWebhook = httpAction(async (ctx, request) => {
  const event = await validateClerkRequest(request);
  if (!event) {
    return new Response("Invalid request", { status: 400 });
  }

  switch (event.type) {
    case "user.created":
      await ctx.runMutation(internal.users.store, {
        clerkUserId: event.data.id,
      });
      break;
    // Add other webhook events to handle here, e.g., user.updated, organization.created, etc.
    default: {
      console.log("Unhandled Clerk webhook event:", event.type);
    }
  }
  return new Response(null, { status: 200 });
});

async function validateClerkRequest(req: Request): Promise<WebhookEvent | undefined> {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error("CLERK_WEBHOOK_SECRET is not set");
    }
  
    const payloadString = await req.text();
    const svixHeaders = {
      "svix-id": req.headers.get("svix-id")!,
      "svix-timestamp": req.headers.get("svix-timestamp")!,
      "svix-signature": req.headers.get("svix-signature")!,
    };
  
    const wh = new Webhook(webhookSecret);
    try {
      const event = wh.verify(payloadString, svixHeaders) as WebhookEvent;
      return event;
    } catch (error) {
      console.error("Error verifying Clerk webhook:", error);
      return undefined;
    }
}


// --- Stripe Webhook Handler ---
const handleStripeWebhook = httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature") as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    // Fix: Removed apiVersion to prevent type conflicts and use the library's default.
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    if (!webhookSecret) {
        throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    }

    let event;
    try {
        const payloadString = await request.text();
        event = stripe.webhooks.constructEvent(payloadString, signature, webhookSecret);
    } catch (err: any) {
        console.error("Error verifying Stripe webhook:", err.message);
        return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }
    
    switch (event.type) {
        case "checkout.session.completed":
            const session = event.data.object as Stripe.Checkout.Session;
            if (!session.metadata?.assessmentId) {
                console.error("Webhook received without assessmentId in metadata");
                return new Response("Missing metadata", { status: 400 });
            }
            await ctx.runMutation(internal.scheduling.fulfillStripeOrder, {
                assessmentId: session.metadata.assessmentId as any,
                stripePaymentId: session.payment_intent as string,
                selectedTime: session.metadata.selectedTime,
            });
            break;
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
            const subscription = event.data.object as Stripe.Subscription;
            await ctx.runMutation(internal.billing.updateSubscription, {
                stripeSubscriptionId: subscription.id,
// Fix: Use bracket notation to access 'current_period_end' to bypass TypeScript error.
                currentPeriodEnd: subscription['current_period_end'] * 1000,
                plan: (subscription.items.data[0].price.lookup_key)!, 
                status: subscription.status,
            });
            break;
        default:
            console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return new Response(null, { status: 200 });
});


// --- HTTP Router ---
const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: handleClerkWebhook,
});

http.route({
    path: "/stripe-webhook",
    method: "POST",
    handler: handleStripeWebhook,
});

export default http;