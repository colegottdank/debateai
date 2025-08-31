import { auth } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/nextjs/server';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!
});

export interface UserSubscriptionData {
  isSubscribed: boolean;
  stripePlan?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export async function getUserSubscription(userId?: string): Promise<UserSubscriptionData> {
  try {
    let userIdToCheck = userId;
    
    if (!userIdToCheck) {
      const { userId: authUserId } = await auth();
      if (!authUserId) {
        return { isSubscribed: false };
      }
      userIdToCheck = authUserId;
    }

    const user = await clerkClient.users.getUser(userIdToCheck);
    
    // Check publicMetadata for subscription info
    const publicMetadata = user.publicMetadata as any;
    
    return {
      isSubscribed: publicMetadata?.stripePlan === 'premium' && publicMetadata?.subscriptionStatus === 'active',
      stripePlan: publicMetadata?.stripePlan,
      subscriptionStatus: publicMetadata?.subscriptionStatus,
      currentPeriodEnd: publicMetadata?.currentPeriodEnd,
      cancelAtPeriodEnd: publicMetadata?.cancelAtPeriodEnd,
    };
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return { isSubscribed: false };
  }
}

export async function updateUserSubscription(
  userId: string,
  subscriptionData: Partial<UserSubscriptionData>,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
) {
  try {
    const publicMetadata: any = {};
    const privateMetadata: any = {};

    // Public metadata (accessible from frontend)
    if (subscriptionData.stripePlan !== undefined) {
      publicMetadata.stripePlan = subscriptionData.stripePlan;
    }
    if (subscriptionData.subscriptionStatus !== undefined) {
      publicMetadata.subscriptionStatus = subscriptionData.subscriptionStatus;
    }
    if (subscriptionData.currentPeriodEnd !== undefined) {
      publicMetadata.currentPeriodEnd = subscriptionData.currentPeriodEnd;
    }
    if (subscriptionData.cancelAtPeriodEnd !== undefined) {
      publicMetadata.cancelAtPeriodEnd = subscriptionData.cancelAtPeriodEnd;
    }

    // Private metadata (only backend)
    if (stripeCustomerId) {
      privateMetadata.stripeCustomerId = stripeCustomerId;
    }
    if (stripeSubscriptionId) {
      privateMetadata.stripeSubscriptionId = stripeSubscriptionId;
    }

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata,
      privateMetadata,
    });

    return true;
  } catch (error) {
    console.error('Error updating user subscription:', error);
    return false;
  }
}

export async function getStripeCustomerId(userId: string): Promise<string | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const privateMetadata = user.privateMetadata as any;
    return privateMetadata?.stripeCustomerId || null;
  } catch (error) {
    console.error('Error getting Stripe customer ID:', error);
    return null;
  }
}