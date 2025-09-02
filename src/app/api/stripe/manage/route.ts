import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body for return URL
    const body = await request.json().catch(() => ({}));
    const returnUrl = body.returnUrl || '/history';

    const user = await d1.getUser(userId);
    
    if (!user || !user.stripe_customer_id) {
      console.error('No customer ID found. User:', user);
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    const { origin } = new URL(request.url);

    // Create customer portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id as string,
      return_url: `${origin}${returnUrl}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating customer portal session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}