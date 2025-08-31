import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await d1.getUser(userId);
    
    return NextResponse.json({
      userId,
      dbUser: user,
      hasCustomerId: !!user?.stripe_customer_id,
      hasSubscriptionId: !!user?.stripe_subscription_id,
    });
  } catch (error: any) {
    console.error('Error fetching user debug info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user debug info' },
      { status: 500 }
    );
  }
}