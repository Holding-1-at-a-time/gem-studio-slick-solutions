
// Fix: Import Convex function builders from './_generated/server'
import { action, internalMutation, query } from './_generated/server';
import { v } from 'convex/values';
import { api, internal } from './_generated/api';
import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY environment variable not set.");
}
const stripe = new Stripe(stripeSecretKey);

/**
 * Creates a Stripe Checkout session for a given assessment.
 * This action is called by the client to initiate the payment process.
 */
export const createStripeCheckoutSession = action({
    args: {
        assessmentId: v.id("assessments"),
        selectedTime: v.string(), // ISO 8601 string for the chosen time
        estimateTotal: v.number(),
        tenantName: v.string(),
        clientEmail: v.string(),
    },
    handler: async (ctx, args) => {
        const domain = process.env.HOSTING_URL || 'http://localhost:3000';
        const assessment = await ctx.runQuery(api.assessments.getAssessmentById, {id: args.assessmentId});
        if (!assessment) throw new Error("Assessment not found");
        
        const successUrl = `${domain}/assessment/${assessment?.clerkOrgId}?session_id={CHECKOUT_SESSION_ID}&assessmentId=${args.assessmentId}`;
        const cancelUrl = `${domain}/assessment/${assessment?.clerkOrgId}`;
        
        try {
            const session = await stripe.checkout.sessions.create({
                line_items: [
                    {
                        price_data: {
                            currency: 'usd',
                            product_data: {
                                name: `Detailing Service for ${args.tenantName}`,
                            },
                            unit_amount: Math.round(args.estimateTotal * 100),
                        },
                        quantity: 1,
                    },
                ],
                mode: 'payment',
                success_url: successUrl,
                cancel_url: cancelUrl,
                customer_email: args.clientEmail,
                metadata: {
                    assessmentId: args.assessmentId,
                    selectedTime: args.selectedTime,
                },
            });
            return { url: session.url };
            
        } catch (error) {
            console.error("Stripe API error:", error);
            return { url: null };
        }
    }
});


/**
 * Fulfills an order after Stripe confirms a successful payment via webhook.
 * This internal mutation creates the final appointment record and schedules follow-up actions.
 */
export const fulfillStripeOrder = internalMutation({
    args: {
        assessmentId: v.id("assessments"),
        stripePaymentId: v.string(),
        selectedTime: v.string(),
    },
    handler: async (ctx, { assessmentId, stripePaymentId, selectedTime }) => {
        const assessment = await ctx.db.get(assessmentId);
        if (!assessment) {
            console.error(`Could not find assessment ${assessmentId} to fulfill order.`);
            return;
        }

        const existingAppointment = await ctx.db.query('appointments')
            .withIndex('by_assessment_id', q => q.eq('assessmentId', assessmentId))
            .unique();
            
        if (existingAppointment) {
            console.log(`Appointment for assessment ${assessmentId} already exists.`);
            return; // Idempotent: don't create a duplicate
        }

        const estimate = await ctx.db.query("estimates")
            .withIndex("by_assessment_id", (q) => q.eq("assessmentId", assessmentId))
            .unique();

        // 1. Create the appointment record
        const appointmentId = await ctx.db.insert("appointments", {
            assessmentId,
            clerkOrgId: assessment.clerkOrgId,
            clientName: assessment.clientName,
            vehicleDescription: `${assessment.vehicleYear} ${assessment.vehicleMake} ${assessment.vehicleModel}`,
            appointmentTime: selectedTime,
            status: 'booked',
            stripePaymentId: stripePaymentId,
            price: estimate?.total, // Store price for analytics
        });
        
        // 2. Schedule follow-up actions
        await ctx.scheduler.runAfter(0, internal.googleCalendar.createEvent, { 
            appointmentId,
            clientEmail: assessment.clientEmail,
            appointmentTime: selectedTime,
            vehicle: `${assessment.vehicleYear} ${assessment.vehicleMake} ${assessment.vehicleModel}`
        });
        
        // 3. Schedule a real appointment reminder 24 hours before the appointment
        const reminderTime = new Date(new Date(selectedTime).getTime() - 24 * 60 * 60 * 1000);
        if (reminderTime > new Date()) {
            await ctx.scheduler.runAt(reminderTime, internal.reminders.sendAppointmentReminder, {
                appointmentId,
                clientName: assessment.clientName,
                clientPhone: assessment.clientPhone, // Assuming you'd send an SMS
            });
        }
        
        console.log(`Successfully booked appointment ${appointmentId} for assessment ${assessmentId}`);
    }
});


/**
 * Retrieves all upcoming appointments for a given tenant organization.
 * Used by the Detailer Dashboard to display their schedule.
 */
export const getUpcomingAppointments = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if(!identity) throw new Error("Not authenticated");

        // Basic authorization check
        if (!identity.orgIds.includes(args.clerkOrgId)) {
            return [];
        }

        return await ctx.db
            .query("appointments")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", args.clerkOrgId))
            .filter(q => q.eq(q.field("status"), "booked"))
            .order("asc")
            .collect();
    }
});

/**
 * Public query to find an appointment by its original assessment ID.
 * Used on the confirmation page to create a review link.
 */
export const getAppointmentByAssessmentId = query({
    args: { assessmentId: v.id("assessments") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("appointments")
            .withIndex("by_assessment_id", (q) => q.eq("assessmentId", args.assessmentId))
            .unique();
    },
});

/**
 * Retrieves all appointments for the currently logged-in client.
 * Used by the Client Dashboard to display their history.
 */
export const getAppointmentsForClient = query({
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        // In a real app with proper client invitations, you'd likely filter by a clerkUserId field on the appointment.
        // For this demo, we filter by the client's name which was captured during assessment.
        const allAppointments = await ctx.db.query("appointments").collect();
        return allAppointments.filter(a => a.clientName === identity.name);
    },
});