import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';
import { checkAppDisabled } from '@/lib/app-disabled';

export async function GET() {
  // Check if app is disabled
  const disabledResponse = checkAppDisabled();
  if (disabledResponse) return disabledResponse;

  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await d1.getUser(userId);
    
    if (!user) {
      // No user record means free tier
      return NextResponse.json({
        isSubscribed: false,
        stripePlan: null,
        subscriptionStatus: null,
        currentPeriodEnd: null,
      });
    }

    return NextResponse.json({
      isSubscribed: user.subscription_status === 'active' && user.stripe_plan === 'premium',
      stripePlan: user.stripe_plan,
      subscriptionStatus: user.subscription_status,
      currentPeriodEnd: user.current_period_end,
      cancelAtPeriodEnd: user.cancel_at_period_end,
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}