import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    // Create a customer portal configuration
    const configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Master Debater - Manage Your Subscription',
      },
      features: {
        customer_update: {
          enabled: true,
          allowed_updates: ['email', 'address', 'phone', 'tax_id'],
        },
        invoice_history: {
          enabled: true,
        },
        payment_method_update: {
          enabled: true,
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
        },
        subscription_update: {
          enabled: false,
          proration_behavior: 'none',
        },
      },
    });

    // Set as active
    await stripe.billingPortal.configurations.update(configuration.id, {
      active: true,
    });

    return NextResponse.json({ 
      success: true, 
      configurationId: configuration.id,
      message: 'Customer portal configured successfully'
    });
  } catch (error: any) {
    console.error('Error setting up customer portal:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to setup portal' },
      { status: 500 }
    );
  }
}