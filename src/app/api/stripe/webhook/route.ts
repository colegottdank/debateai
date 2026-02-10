import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { d1 } from '@/lib/d1';
import Stripe from 'stripe';
import { errors } from '@/lib/api-errors';

/**
 * Stripe webhook handler.
 * Note: Not using withErrorHandler - webhooks must return 200 quickly
 * or Stripe will retry. We handle errors manually here.
 */
export async function POST(request: NextRequest) {
  console.log('🔔 Webhook endpoint called');
  
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  console.log('📝 Webhook received, signature present:', !!signature);

  if (!signature) {
    console.error('❌ No signature provided');
    return errors.badRequest('No signature provided');
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    console.log('🔑 Webhook secret configured:', !!webhookSecret);
    
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return errors.internal('Webhook secret not configured');
    }
    
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    console.log('✅ Event constructed successfully:', event.type);
  } catch (err) {
    const error = err as Error;
    console.error('Webhook signature verification failed:', error.message);
    return errors.badRequest('Invalid signature');
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkUserId = session.metadata?.clerkUserId;
        
        console.log('💳 Checkout completed for user:', clerkUserId);
        console.log('📦 Subscription ID:', session.subscription);
        
        if (clerkUserId && session.subscription) {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          
          // Save to database
          console.log('💾 Saving user to D1:', {
            clerkUserId,
            customerId: session.customer,
            subscriptionId: subscription.id
          });
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subAny = subscription as any;
          const updateResult = await d1.upsertUser({
            clerkUserId,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePlan: 'premium',
            subscriptionStatus: 'active',
            currentPeriodEnd: subAny.current_period_end 
              ? new Date(subAny.current_period_end * 1000).toISOString()
              : undefined,
            cancelAtPeriodEnd: subAny.cancel_at_period_end || false,
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subAny = subscription as any;
          const periodEnd = subAny.current_period_end 
            ? new Date(subAny.current_period_end * 1000).toISOString()
            : undefined;
            
          await d1.upsertUser({
            clerkUserId,
            subscriptionStatus: subscription.status,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: subAny.cancel_at_period_end || false,
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
        const subscriptionId = (invoice as { subscription?: string }).subscription;
        
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
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
  } catch (error) {
    console.error('Webhook handler error:', error);
    // Return 200 to prevent Stripe retries for unrecoverable errors
    // Log the error but acknowledge receipt
    return NextResponse.json({ received: true, error: 'Handler error logged' });
  }
}
