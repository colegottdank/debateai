import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';

// This is a one-time setup endpoint to create the product and price
// Only run this once to set up your Stripe product
export async function POST() {
  try {
    // One-time setup - no auth needed for initial creation

    // Check if product already exists
    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find(p => p.name === 'Master Debater Premium');

    if (!product) {
      // Create the product
      product = await stripe.products.create({
        name: 'Master Debater Premium',
        description: 'Unlimited debates and messages - become the ultimate Master Debater!',
        metadata: {
          app: 'masterdebater'
        }
      });
    }

    // Check if price already exists
    const prices = await stripe.prices.list({ 
      product: product.id,
      limit: 100 
    });
    
    let price = prices.data.find(p => p.recurring?.interval === 'month' && p.unit_amount === 499);

    if (!price) {
      // Create the price ($4.99/month)
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: 499, // $4.99 in cents
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
        metadata: {
          app: 'masterdebater'
        }
      });
    }

    return NextResponse.json({
      success: true,
      priceId: price.id,
      productId: product.id,
      message: `Add this to your .env.local: STRIPE_PRICE_ID=${price.id}`
    });
  } catch (error: any) {
    console.error('Error creating Stripe price:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create price' },
      { status: 500 }
    );
  }
}