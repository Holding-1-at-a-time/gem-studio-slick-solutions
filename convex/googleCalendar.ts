
// Fix: Import Convex function builders from './_generated/server'
import { action, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { internal } from './_generated/api';

/**
 * SIMULATED ACTION: Creates a Google Calendar event for a new appointment.
 * In a real application, this would use the Google Calendar API.
 */
export const createEvent = action({
    args: {
        appointmentId: v.id("appointments"),
        clientEmail: v.string(),
        appointmentTime: v.string(),
        vehicle: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("--- SIMULATING GOOGLE CALENDAR EVENT CREATION ---");
        console.log(`Creating event for: ${args.vehicle}`);
        console.log(`Time: ${new Date(args.appointmentTime).toLocaleString()}`);
        console.log(`Attendees: [detailer@slick.com, ${args.clientEmail}]`);

        // This is where you would use `googleapis` to create the event.
        // const { google } = require('googleapis');
        // const calendar = google.calendar('v3');
        // const event = await calendar.events.insert({ ... });
        // const googleCalendarEventId = event.data.id;

        const mockEventId = `gc_event_${crypto.randomUUID()}`;

        // Update the appointment in Convex with the new event ID
        await ctx.runMutation(internal.googleCalendar.storeEventId, {
            appointmentId: args.appointmentId,
            googleCalendarEventId: mockEventId
        });

        console.log(`--- SIMULATION COMPLETE: Event ID ${mockEventId} ---`);

        return mockEventId;
    }
});

// Internal mutation to store the event ID back in the appointment record
export const storeEventId = internalMutation({
    args: {
        appointmentId: v.id("appointments"),
        googleCalendarEventId: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.appointmentId, {
            googleCalendarEventId: args.googleCalendarEventId,
        });
    },
});