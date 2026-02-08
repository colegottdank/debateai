import Stripe from "stripe";

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  // Check if we're in production with test keys
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const isTestKey = stripeKey.startsWith("sk_test_");

  if (process.env.NODE_ENV === "production" && isTestKey) {
    console.error("CRITICAL: Using TEST Stripe keys in PRODUCTION environment!");
    console.error("Please set LIVE Stripe keys in Vercel environment variables");
  }

  _stripe = new Stripe(stripeKey, {
    apiVersion: "2026-01-28.clover",
  });
  
  return _stripe;
}

// Keep backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export interface SubscriptionData {
  isSubscribed: boolean;
  stripePlan?: string;
  subscriptionStatus?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}
