import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';
import { stripe } from '@/lib/stripe';

// Allow GET for easy browser access
export async function GET() {
  return handleFix();
}

export async function POST() {
  return handleFix();
}

async function handleFix() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email from their most recent subscription
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
    });

    // Find subscription with matching clerk user ID in metadata
    let userSubscription = null;
    let customerId = null;
    
    for (const sub of subscriptions.data) {
      if (sub.metadata?.clerkUserId === userId) {
        userSubscription = sub;
        customerId = sub.customer as string;
        break;
      }
    }

    if (!userSubscription || !customerId) {
      return NextResponse.json({ error: 'No subscription found for user' }, { status: 404 });
    }

    // Update the database with the correct IDs
    const updateResult = await d1.upsertUser({
      clerkUserId: userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: userSubscription.id,
      stripePlan: 'premium',
      subscriptionStatus: userSubscription.status,
      currentPeriodEnd: new Date((userSubscription as any).current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: userSubscription.cancel_at_period_end,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription data fixed',
      customerId,
      subscriptionId: userSubscription.id,
      updateResult
    });
  } catch (error: any) {
    console.error('Error fixing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fix subscription' },
      { status: 500 }
    );
  }
}