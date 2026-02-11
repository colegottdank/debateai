import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth, currentUser } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';
import { checkAppDisabled } from '@/lib/app-disabled';
import { errors, withErrorHandler } from '@/lib/api-errors';

export const POST = withErrorHandler(async (request: Request) => {
  // Check if app is disabled
  const disabledResponse = checkAppDisabled();
  if (disabledResponse) return disabledResponse;

  const { userId } = await auth();
  
  if (!userId) {
    throw errors.unauthorized();
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
    throw errors.badRequest('You already have an active subscription', { hasSubscription: true });
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
    } as Parameters<typeof stripe.subscriptions.list>[0]);
    
    if (subscriptions.data.length > 0) {
      // Update database if it's out of sync
      if (dbUser && dbUser.subscription_status !== 'active') {
        const activeSubscription = subscriptions.data[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subAny = activeSubscription as any;
        await d1.upsertUser({
          clerkUserId: userId,
          stripeCustomerId: customerId as string,
          stripeSubscriptionId: activeSubscription.id,
          stripePlan: 'premium',
          subscriptionStatus: 'active',
          currentPeriodEnd: subAny.current_period_end 
            ? new Date(subAny.current_period_end * 1000).toISOString() 
            : undefined,
          cancelAtPeriodEnd: activeSubscription.cancel_at_period_end,
        });
      }
      throw errors.badRequest('You already have an active subscription', { hasSubscription: true });
    }
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    console.error('STRIPE_PRICE_ID not configured');
    throw errors.internal('Payment configuration error');
  }

  const { origin } = new URL(request.url);
  
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
    allow_promotion_codes: true,
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
  }).catch((error: Error & { type?: string; message?: string }) => {
    console.error('Error creating checkout session:', error);
    
    if (error.type === 'StripeConnectionError') {
      throw errors.disabled('Unable to connect to payment service. Please try again later.');
    }
    
    if (error.type === 'StripeAPIError' || error.message?.includes('No such price')) {
      console.error('Stripe error:', error.message);
      throw errors.internal('Payment service error. Please contact support.');
    }
    
    throw errors.internal('Failed to create checkout session');
  });

  return NextResponse.json({ url: session.url });
});
