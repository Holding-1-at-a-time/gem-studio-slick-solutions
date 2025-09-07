import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  tenants: defineTable({
    name: v.string(),
    clerkOrgId: v.string(),
    themeColor: v.optional(v.string()),
  }).index('by_clerk_org_id', ['clerkOrgId']),

  users: defineTable({
    clerkUserId: v.string(),
  }).index('by_clerk_user_id', ['clerkUserId']),

  pricingModels: defineTable({
    clerkOrgId: v.string(),
    services: v.array(v.object({
      name: v.string(),
      basePrice: v.number(),
      description: v.string(),
    })),
  }).index('by_clerk_org_id', ['clerkOrgId']),

  assessments: defineTable({
    clerkOrgId: v.string(),
    clientName: v.string(),
    clientEmail: v.string(),
    clientPhone: v.string(),
    vehicleYear: v.string(),
    vehicleMake: v.string(),
    vehicleModel: v.string(),
    vin: v.string(),
    conditionNotes: v.string(),
  }),

  estimates: defineTable({
    assessmentId: v.id('assessments'),
    items: v.array(v.object({
      description: v.string(),
      price: v.number(),
    })),
    total: v.number(),
    suggestedAddons: v.optional(v.array(v.object({ // For AI Upselling
        name: v.string(),
        description: v.string(),
        price: v.number(),
    })))
  }).index('by_assessment_id', ['assessmentId']),

  estimateJobs: defineTable({
    assessmentId: v.id('assessments'),
    status: v.union(
      v.literal('pending'),
      v.literal('in_progress'),
      v.literal('completed'),
      v.literal('failed')
    ),
  }).index('by_assessment_id', ['assessmentId']),
  
  appointments: defineTable({
    assessmentId: v.id('assessments'),
    clerkOrgId: v.string(),
    clientName: v.string(),
    vehicleDescription: v.string(),
    appointmentTime: v.string(),
    status: v.union(v.literal('booked'), v.literal('completed'), v.literal('canceled')),
    stripePaymentId: v.string(),
    googleCalendarEventId: v.optional(v.string()),
    price: v.optional(v.number()),
  })
  .index('by_clerk_org_id', ['clerkOrgId'])
  .index('by_assessment_id', ['assessmentId']),

  reviews: defineTable({
    appointmentId: v.id('appointments'),
    clerkOrgId: v.string(),
    rating: v.number(),
    comment: v.string(),
    clientName: v.optional(v.string()),
  })
  .index('by_appointment_id', ['appointmentId'])
  .index('by_clerk_org_id', ['clerkOrgId']),

  availability: defineTable({
    clerkOrgId: v.string(),
    availableSlots: v.array(v.string()),
  }).index('by_clerk_org_id', ['clerkOrgId']),

  subscriptions: defineTable({
      clerkOrgId: v.string(),
      stripeSubscriptionId: v.string(),
      endsAt: v.optional(v.number()),
      currentPeriodEnd: v.number(),
      plan: v.union(v.literal("free"), v.literal("pro"), v.literal("enterprise")),
  }).index('by_clerk_org_id', ['clerkOrgId']),

  // --- New Tables for AI & Scalability ---
  aiInsights: defineTable({ // For AI Business Optimizer
    clerkOrgId: v.string(),
    insight: v.object({
      type: v.string(), // e.g., 'pricing', 'marketing'
      title: v.string(),
      description: v.string(),
      actionDetails: v.optional(v.any()), // e.g., { serviceName: "...", newPrice: 123 }
    }),
    generatedAt: v.number(),
  }).index('by_clerk_org_id', ['clerkOrgId']),

  analyticsCache: defineTable({ // For performance caching
    clerkOrgId: v.string(),
    metrics: v.object({
        totalRevenue: v.number(),
        totalAppointments: v.number(),
        averageRating: v.number(),
        revenueForecast: v.array(v.object({ month: v.string(), revenue: v.number() })),
    }),
    updatedAt: v.number(),
  }).index('by_clerk_org_id', ['clerkOrgId']),
});