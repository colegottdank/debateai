import { NextResponse } from 'next/server';
import { PERSONA_CATEGORIES, getPersonasByCategory } from '@/lib/personas';
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

// Rate limit: 60 requests per minute per IP (public endpoint)
const ipLimiter = createRateLimiter({ maxRequests: 60, windowMs: 60_000 });

export async function GET(request: Request) {
  const ipRl = ipLimiter.check(getClientIp(request));
  if (!ipRl.allowed) return rateLimitResponse(ipRl);

  const data = PERSONA_CATEGORIES.map(category => ({
    ...category,
    personas: getPersonasByCategory(category.id)
  }));

  return NextResponse.json({ categories: data });
}
