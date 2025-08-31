import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not set");
  throw new Error("STRIPE_SECRET_KEY is not set");
}

// Check if we're in production with test keys
const stripeKey = process.env.STRIPE_SECRET_KEY;
const isTestKey = stripeKey.startsWith("sk_test_");
const keyType = isTestKey ? "TEST" : "LIVE";

// Log configuration (sanitized)
console.log("Stripe Configuration:", {
  environment: process.env.NODE_ENV,
  keyType,
  keyPrefix: stripeKey.substring(0, 7),
  priceId: process.env.STRIPE_PRICE_ID,
});

if (process.env.NODE_ENV === "production" && isTestKey) {
  console.error("CRITICAL: Using TEST Stripe keys in PRODUCTION environment!");
  console.error("Please set LIVE Stripe keys in Vercel environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
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
