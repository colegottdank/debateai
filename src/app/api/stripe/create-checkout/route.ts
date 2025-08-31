import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body for return URL
    const body = await request.json().catch(() => ({}));
    const returnUrl = body.returnUrl || '/debate';

    const clerkUser = await currentUser();
    const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
    
    // Check for existing customer in database
    const dbUser = await d1.getUser(userId);
    
    // Check if user already has an active subscription
    if (dbUser?.subscription_status === 'active' && dbUser?.stripe_plan === 'premium') {
      console.log('User already has active subscription:', userId);
      return NextResponse.json(
        { 
          error: 'You already have an active subscription', 
          hasSubscription: true 
        }, 
        { status: 400 }
      );
    }
    
    let customerId = dbUser?.stripe_customer_id;
    
    if (!customerId && email) {
      // Check if customer exists by email
      const customers = await stripe.customers.list({
        email,
        limit: 1,
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        // Create new customer
        const customer = await stripe.customers.create({
          email,
          metadata: {
            clerkUserId: userId,
          },
        });
        customerId = customer.id;
      }
    }
    
    // If customer exists, check for active subscriptions in Stripe
    if (customerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 10,
      } as any);
      
      if (subscriptions.data.length > 0) {
        console.log('Customer has active Stripe subscription:', customerId);
        // Update database if it's out of sync
        if (dbUser && dbUser.subscription_status !== 'active') {
          const activeSubscription = subscriptions.data[0];
          await d1.upsertUser({
            clerkUserId: userId,
            stripeCustomerId: customerId as string,
            stripeSubscriptionId: activeSubscription.id,
            stripePlan: 'premium',
            subscriptionStatus: 'active',
            currentPeriodEnd: new Date((activeSubscription as any).current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
          });
        }
        return NextResponse.json(
          { 
            error: 'You already have an active subscription', 
            hasSubscription: true 
          }, 
          { status: 400 }
        );
      }
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      throw new Error('STRIPE_PRICE_ID not configured');
    }

    const { origin } = new URL(request.url);

    console.log('Creating checkout session for userId:', userId);
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId as string || undefined,
      customer_email: !customerId ? email : undefined,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}${returnUrl}${returnUrl.includes('?') ? '&' : '?'}upgraded=true`,
      cancel_url: `${origin}${returnUrl}${returnUrl.includes('?') ? '&' : '?'}canceled=true`,
      metadata: {
        clerkUserId: userId,
      },
      subscription_data: {
        metadata: {
          clerkUserId: userId,
        },
      },
    });
    
    console.log('Checkout session created:', session.id, 'with metadata:', session.metadata);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error
    });
    
    // More detailed error information for Stripe connection issues
    if (error.type === 'StripeConnectionError') {
      return NextResponse.json(
        { 
          error: 'Unable to connect to payment service. Please try again later.',
          details: error.message,
          type: 'connection'
        },
        { status: 503 }
      );
    }
    
    if (error.type === 'StripeAPIError') {
      return NextResponse.json(
        { 
          error: 'Payment service error. Please check your configuration.',
          details: error.message,
          type: 'api'
        },
        { status: 500 }
      );
    }
    
    // Check for specific error messages
    if (error.message?.includes('No such price')) {
      return NextResponse.json(
        { 
          error: 'Invalid price configuration. Please contact support.',
          details: 'Price ID not found in Stripe',
          type: 'configuration'
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create checkout session',
        type: error.type || 'unknown',
        code: error.code,
        details: error.message
      },
      { status: 500 }
    );
  }
}