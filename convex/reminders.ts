
// Fix: Import Convex function builders from './_generated/server'
import { action } from './_generated/server';
import { v } from 'convex/values';

/**
 * SIMULATED ACTION: Sends an SMS reminder for an upcoming appointment.
 * This is triggered by a Convex scheduled job.
 */
export const sendAppointmentReminder = action({
    args: {
        appointmentId: v.id("appointments"),
        clientName: v.string(),
        clientPhone: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("--- SIMULATING APPOINTMENT REMINDER (SMS) ---");
        console.log(`To: ${args.clientPhone}`);
        console.log(`Message: Hi ${args.clientName}, this is a reminder for your vehicle detailing appointment tomorrow.`);
        console.log(`Appointment ID: ${args.appointmentId}`);
        
        // In a real application, you would integrate with an SMS service like Twilio here.
        // const twilio = require('twilio');
        // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        // await client.messages.create({ ... });

        console.log("--- SIMULATION COMPLETE ---");

        // No return value needed for a fire-and-forget task like this.
    }
});