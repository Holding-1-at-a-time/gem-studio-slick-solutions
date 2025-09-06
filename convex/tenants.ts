
import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { getUserByClerkId, getAdminUser } from './users';

// Helper to check if a user is a global admin
const checkAdmin = async (ctx: any) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new ConvexError('Not authenticated');
    }
    const adminUser = await getAdminUser(ctx, identity.subject);
    if (!adminUser) {
        throw new ConvexError('You must be an admin to perform this action.');
    }
    return adminUser;
}

// Mutation for an Admin to create a new tenant organization.
export const createTenant = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);

    // This is a simplified version. A real-world app would use a Convex HTTP Action
    // to call the Clerk Backend API (clerkClient.organizations.createOrganization)
    // to create the organization in Clerk, get the new org ID, and then store it here.
    const mockOrgId = `org_${crypto.randomUUID()}`;
    
    const tenantId = await ctx.db.insert('tenants', {
      name: args.name,
      clerkOrgId: mockOrgId,
    });
    
    console.log(`Created tenant '${args.name}' with mock Clerk Org ID: ${mockOrgId}`);
    return tenantId;
  },
});

// Query for an Admin to retrieve all tenants.
export const getAllTenants = query({
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db.query('tenants').collect();
  },
});
