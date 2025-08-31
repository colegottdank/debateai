import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: Request) {
  try {
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      throw new Error('STRIPE_PRICE_ID not configured');
    }

    const { origin } = new URL(request.url);
    const testUserId = 'test-user-' + Date.now();
    
    console.log('Creating TEST checkout session for test user:', testUserId);
    
    // Create checkout session for testing
    const session = await stripe.checkout.sessions.create({
      customer_email: 'test@example.com',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/debate?upgraded=true&test=true`,
      cancel_url: `${origin}/debate?canceled=true`,
      metadata: {
        clerkUserId: testUserId,
      },
      subscription_data: {
        metadata: {
          clerkUserId: testUserId,
        },
      },
    });
    
    console.log('TEST checkout session created:', session.id);

    // Redirect to Stripe checkout
    return NextResponse.redirect(session.url!);
  } catch (error: any) {
    console.error('Error creating test checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create test checkout session' },
      { status: 500 }
    );
  }
}