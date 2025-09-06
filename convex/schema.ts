
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  tenants: defineTable({
    name: v.string(),
    clerkOrgId: v.string(),
  }).index('by_clerk_org_id', ['clerkOrgId']),

  users: defineTable({
    clerkUserId: v.string(),
    // Additional user data can be stored here
  }).index('by_clerk_user_id', ['clerkUserId']),
});
