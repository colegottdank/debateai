import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { d1 } from '@/lib/d1';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  console.log('🔔 Webhook endpoint called');
  
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  console.log('📝 Webhook received, signature present:', !!signature);

  if (!signature) {
    console.error('❌ No signature provided');
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    console.log('🔑 Webhook secret configured:', !!webhookSecret);
    console.log('🔑 Secret starts with:', webhookSecret?.substring(0, 10));
    
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }
    
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('✅ Event constructed successfully:', event.type);
  } catch (err: any) {
    console.error('Webhook error:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerkUserId;
        
        console.log('💳 Checkout completed for user:', clerkUserId);
        console.log('📦 Subscription ID:', session.subscription);
        
        if (clerkUserId && session.subscription) {
          // Check if user already has an active subscription
          const existingUser = await d1.getUser(clerkUserId);
          if (existingUser?.subscription_status === 'active' && 
              existingUser?.stripe_subscription_id && 
              existingUser?.stripe_subscription_id !== session.subscription) {
            // You might want to cancel the old subscription or handle this case
          }
          
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          // Save to database - ensure customer ID is saved
          console.log('💾 Saving user to D1:', {
            clerkUserId,
            customerId: session.customer,
            subscriptionId: subscription.id
          });
          
          const updateResult = await d1.upsertUser({
            clerkUserId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePlan: 'premium',
            subscriptionStatus: 'active',
            currentPeriodEnd: (subscription as any).current_period_end 
              ? new Date((subscription as any).current_period_end * 1000).toISOString()
              : undefined,
            cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
          });
          
          console.log('✅ D1 upsert result:', updateResult);
          
          if (!updateResult || !updateResult.success) {
            console.error('❌ Failed to save to D1:', updateResult);
          }
        } else if (clerkUserId) {
          // Even if no subscription in session, save the customer ID
          await d1.upsertUser({
            clerkUserId,
            stripeCustomerId: session.customer as string,
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkUserId = subscription.metadata?.clerkUserId;
        
        if (clerkUserId) {
          const periodEnd = (subscription as any).current_period_end 
            ? new Date((subscription as any).current_period_end * 1000).toISOString()
            : undefined;
            
          await d1.upsertUser({
            clerkUserId,
            subscriptionStatus: subscription.status,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
            stripePlan: subscription.status === 'active' ? 'premium' : undefined,
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const clerkUserId = subscription.metadata?.clerkUserId;
        
        if (clerkUserId) {
          await d1.upsertUser({
            clerkUserId,
            stripePlan: undefined,
            subscriptionStatus: 'canceled',
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscription = (invoice as any).subscription;
        
        if (subscription) {
          const sub = await stripe.subscriptions.retrieve(subscription as string);
          const clerkUserId = sub.metadata?.clerkUserId;
          
          if (clerkUserId) {
            await d1.upsertUser({
              clerkUserId,
              subscriptionStatus: 'past_due',
              stripePlan: undefined,
            });
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}