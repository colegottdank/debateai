import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    const priceId = process.env.STRIPE_PRICE_ID || '';
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
    
    // Determine if we're using test or live keys
    const isTestMode = stripeKey.startsWith('sk_test_');
    const keyType = isTestMode ? 'TEST' : 'LIVE';
    
    // Sanitize keys for display (show only first and last few characters)
    const sanitizeKey = (key: string) => {
      if (!key) return 'NOT_SET';
      if (key.length < 20) return 'INVALID_KEY';
      return `${key.substring(0, 7)}...${key.substring(key.length - 4)}`;
    };
    
    return NextResponse.json({
      status: 'ok',
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      stripe: {
        keyType,
        isTestMode,
        secretKey: sanitizeKey(stripeKey),
        publishableKey: sanitizeKey(publishableKey),
        priceId: priceId || 'NOT_SET',
        expectedProdPriceId: 'price_1S0asWF2XB7xACfuSjpoma63',
        priceIdCorrect: priceId === 'price_1S0asWF2XB7xACfuSjpoma63',
      },
      warnings: [
        ...(isTestMode && process.env.NODE_ENV === 'production' ? ['Using TEST keys in PRODUCTION!'] : []),
        ...(!stripeKey ? ['Stripe secret key not configured'] : []),
        ...(!priceId ? ['Stripe price ID not configured'] : []),
        ...(priceId && priceId !== 'price_1S0asWF2XB7xACfuSjpoma63' && process.env.NODE_ENV === 'production' ? ['Using wrong price ID for production'] : []),
      ]
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Failed to get configuration'
    }, { status: 500 });
  }
}