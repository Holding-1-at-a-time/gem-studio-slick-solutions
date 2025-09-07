
// Fix: Import Convex function builders from './_generated/server'
import { query, action, internalMutation, internalQuery, mutation } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';
import { getAdminUser } from './users';
import { internal } from './_generated/api';

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

// Action for an Admin to create a new tenant organization.
export const createTenant = action({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await checkAdmin(ctx);

    const clerkApiKey = process.env.CLERK_SECRET_KEY;
    if (!clerkApiKey) {
      throw new Error("CLERK_SECRET_KEY environment variable not set.");
    }
    
    // Step 1: Call Clerk API to create the organization
    const response = await fetch('https://api.clerk.com/v1/organizations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clerkApiKey}`
        },
        body: JSON.stringify({ name: args.name, created_by: (await ctx.auth.getUserIdentity())!.subject })
    });
    
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Failed to create organization in Clerk: ${errorBody}`);
    }
    
    const clerkOrg = await response.json();
    const clerkOrgId = clerkOrg.id;

    // Step 2: Store the new tenant and associated resources in Convex
    await ctx.runMutation(internal.tenants.storeTenant, {
      name: args.name,
      clerkOrgId: clerkOrgId,
    });
    
    console.log(`Created tenant '${args.name}' with Clerk Org ID: ${clerkOrgId}`);
    return clerkOrgId;
  },
});

export const storeTenant = internalMutation({
    args: { name: v.string(), clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.insert('tenants', {
            name: args.name,
            clerkOrgId: args.clerkOrgId,
            themeColor: '#ffffff', // Default theme color
        });
        
        // Create a default pricing model for the new tenant
        await ctx.db.insert('pricingModels', {
            clerkOrgId: args.clerkOrgId,
            services: [
                { name: "Standard Exterior Wash", basePrice: 45, description: "Full exterior wash and dry." },
                { name: "Standard Interior Detail", basePrice: 60, description: "Vacuuming, wipe down of all surfaces." },
                { name: "Premium Wax & Polish", basePrice: 80, description: "Application of high-quality carnauba wax." },
                { name: "Full Interior Shampoo", basePrice: 120, description: "Deep cleaning of carpets and upholstery." },
            ],
        });
    
        // Seed default availability for the next 7 days at 10 AM and 2 PM
        const today = new Date();
        const availableSlots = [];
        for (let i = 1; i <= 7; i++) {
            const nextDay = new Date(today);
            nextDay.setDate(today.getDate() + i);
            nextDay.setHours(10, 0, 0, 0);
            availableSlots.push(nextDay.toISOString());
            nextDay.setHours(14, 0, 0, 0);
            availableSlots.push(nextDay.toISOString());
        }
        await ctx.db.insert('availability', { clerkOrgId: args.clerkOrgId, availableSlots });
        
        // Create a mock subscription for the new tenant
        const now = Date.now();
        await ctx.db.insert('subscriptions', {
            clerkOrgId: args.clerkOrgId,
            stripeSubscriptionId: `sub_mock_${crypto.randomUUID()}`,
            currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000, // 30 days from now
            plan: "pro",
        });
    }
})

// Query for an Admin to retrieve all tenants.
export const getAllTenants = query({
  handler: async (ctx) => {
    await checkAdmin(ctx);
    return await ctx.db.query('tenants').collect();
  },
});

// Public query to get tenant info by org ID for the assessment page
export const getTenantByOrgId = query({
    args: { clerkOrgId: v.string() },
    handler: async (ctx, args) => {
        const tenant = await ctx.db
            .query('tenants')
            .withIndex('by_clerk_org_id', (q) => q.eq('clerkOrgId', args.clerkOrgId))
            .unique();
        
        if (!tenant) {
            return null;
        }

        return { name: tenant.name, themeColor: tenant.themeColor };
    }
});

export const getMyTenant = query({
    handler: async (ctx) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || !identity.orgId) {
        return null;
      }
  
      return await ctx.db
        .query("tenants")
        .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", identity.orgId!))
        .unique();
    },
  });

// Mutation to update the tenant's theme color
export const updateTheme = mutation({
    args: { themeColor: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity || !identity.orgId) throw new ConvexError("Not authenticated or no active organization.");

        const tenant = await ctx.db
            .query("tenants")
            .withIndex("by_clerk_org_id", (q) => q.eq("clerkOrgId", identity.orgId!))
            .unique();

        if (!tenant) throw new ConvexError("Tenant not found.");
        
        // Basic validation for hex color
        if (!/^#([0-9A-F]{3}){1,2}$/i.test(args.themeColor)) {
            throw new ConvexError("Invalid hex color format.");
        }

        await ctx.db.patch(tenant._id, { themeColor: args.themeColor });
    },
});

// Internal query for scheduled jobs to get all tenants without auth checks.
export const listAllTenantsForInternalUse = internalQuery({
    handler: async (ctx) => {
        return await ctx.db.query("tenants").collect();
    }
});