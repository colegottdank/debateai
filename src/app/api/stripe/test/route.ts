import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET() {
  try {
    const key = process.env.STRIPE_SECRET_KEY || '';
    
    if (!key) {
      return NextResponse.json({ error: 'No Stripe key configured' }, { status: 500 });
    }
    
    // Create a fresh Stripe instance with minimal config
    const testStripe = new Stripe(key, {
      apiVersion: '2025-07-30.basil',
      timeout: 10000,
      maxNetworkRetries: 1,
    });
    
    // Try the simplest possible API call
    try {
      const balance = await testStripe.balance.retrieve();
      return NextResponse.json({
        success: true,
        keyType: key.startsWith('sk_test_') ? 'TEST' : 'LIVE',
        balance: {
          available: balance.available[0]?.amount || 0,
          pending: balance.pending[0]?.amount || 0,
          currency: balance.available[0]?.currency || 'usd',
        }
      });
    } catch (stripeError: any) {
      console.error('Stripe test error:', stripeError);
      return NextResponse.json({
        success: false,
        keyType: key.startsWith('sk_test_') ? 'TEST' : 'LIVE',
        error: stripeError.message,
        type: stripeError.type,
        code: stripeError.code,
        statusCode: stripeError.statusCode,
      });
    }
  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}