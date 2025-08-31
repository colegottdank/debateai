import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

// Cache the price for 1 hour
let priceCache: { price: any; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET() {
  try {
    // Check cache
    if (priceCache && Date.now() - priceCache.timestamp < CACHE_DURATION) {
      return NextResponse.json(priceCache.price);
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    
    if (!priceId) {
      // Return fallback price if not configured
      return NextResponse.json({
        amount: 2000, // $20.00 in cents
        currency: 'usd',
        formatted: '$20.00',
        interval: 'month',
        isFallback: true
      });
    }

    try {
      // Fetch price from Stripe
      const price = await stripe.prices.retrieve(priceId);
      
      const priceData = {
        amount: price.unit_amount || 2000,
        currency: price.currency,
        formatted: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: price.currency.toUpperCase(),
        }).format((price.unit_amount || 2000) / 100),
        interval: price.recurring?.interval || 'month',
        isFallback: false
      };

      // Update cache
      priceCache = {
        price: priceData,
        timestamp: Date.now()
      };

      return NextResponse.json(priceData);
    } catch (stripeError: any) {
      console.error('Stripe price fetch error:', stripeError);
      
      // Return fallback price if Stripe fails
      return NextResponse.json({
        amount: 2000,
        currency: 'usd',
        formatted: '$20.00',
        interval: 'month',
        isFallback: true,
        error: 'Using fallback price'
      });
    }
  } catch (error: any) {
    console.error('Price endpoint error:', error);
    return NextResponse.json({
      amount: 2000,
      currency: 'usd',
      formatted: '$20.00',
      interval: 'month',
      isFallback: true,
      error: error.message
    });
  }
}