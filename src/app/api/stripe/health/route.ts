import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    const priceId = process.env.STRIPE_PRICE_ID || '';
    
    // Basic config check
    const isTestMode = stripeKey.startsWith('sk_test_');
    const keyType = isTestMode ? 'TEST' : 'LIVE';
    
    // Try to make a simple Stripe API call
    let stripeStatus = 'unknown';
    let stripeError = null;
    
    try {
      // Dynamic import to avoid initialization issues
      const { stripe } = await import('@/lib/stripe');
      
      // Try to retrieve the price as a simple test
      if (priceId) {
        const price = await stripe.prices.retrieve(priceId);
        stripeStatus = 'connected';
        
        // Return health check with price info
        return NextResponse.json({
          status: 'healthy',
          stripe: {
            connected: true,
            keyType,
            priceFound: true,
            priceAmount: price.unit_amount,
            priceCurrency: price.currency,
          },
          timestamp: new Date().toISOString()
        });
      } else {
        stripeStatus = 'no_price_id';
      }
    } catch (error: any) {
      stripeStatus = 'error';
      stripeError = error.message;
      console.error('Stripe health check failed:', error);
    }
    
    return NextResponse.json({
      status: stripeStatus === 'connected' ? 'healthy' : 'unhealthy',
      stripe: {
        connected: false,
        keyType,
        status: stripeStatus,
        error: stripeError,
        keyConfigured: !!stripeKey,
        priceConfigured: !!priceId,
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}