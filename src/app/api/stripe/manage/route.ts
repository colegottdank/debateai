import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { auth } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';
import { withErrorHandler, errors } from '@/lib/api-errors';
import { z } from 'zod';

const manageSchema = z.object({
  returnUrl: z.string().max(200).optional().default('/history'),
});

export const POST = withErrorHandler(async (request: Request) => {
  const { userId } = await auth();

  if (!userId) {
    throw errors.unauthorized();
  }

  // Parse and validate body
  let body: z.infer<typeof manageSchema>;
  try {
    const rawBody = await request.json().catch(() => ({}));
    body = manageSchema.parse(rawBody);
  } catch {
    body = { returnUrl: '/history' };
  }

  const user = await d1.getUser(userId);

  if (!user || !user.stripe_customer_id) {
    console.error('No customer ID found. User:', user);
    throw errors.notFound('No subscription found');
  }

  const { origin } = new URL(request.url);

  // Create customer portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripe_customer_id as string,
    return_url: `${origin}${body.returnUrl}`,
  });

  return NextResponse.json({ url: session.url });
});