

import { internalMutation } from 'convex/server';
import { ConvexError } from 'convex/values';

/**
 * Retrieves a user from the database by their Clerk user ID.
 */
export const getUserByClerkId = async (ctx: any, clerkUserId: string) => {
  return await ctx.db
    .query('users')
    .withIndex('by_clerk_user_id', (q: any) => q.eq('clerkUserId', clerkUserId))
    .unique();
};


/**
 * Retrieves a user and verifies they have the 'admin' role from Clerk metadata.
 * Note: This relies on the client-side claim. For full security, Clerk user data
 * should be fetched server-side via an HTTP Action to verify the role.
 */
export const getAdminUser = async (ctx: any, clerkUserId: string) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new ConvexError("Not authenticated.");
    }

    if (identity.publicMetadata?.role !== 'admin') {
        return null;
    }
    
    const user = await getUserByClerkId(ctx, clerkUserId);

    if(!user) {
        return null;
    }
    
    return user;
}


/**
 * Stores a new user from a Clerk webhook.
 * This is an internal mutation that should be triggered by an HTTP action
 * listening to Clerk's user.created webhook.
 */
// Fix: Use the 'internalMutation' factory function instead of the 'InternalMutation' type.
export const store = internalMutation({
  handler: async (ctx, { clerkUserId }: { clerkUserId: string }) => {
    const existingUser = await getUserByClerkId(ctx, clerkUserId);
    if (existingUser) {
      console.log(`User ${clerkUserId} already exists.`);
      return existingUser._id;
    }

    return await ctx.db.insert('users', {
      clerkUserId: clerkUserId,
    });
  },
});
