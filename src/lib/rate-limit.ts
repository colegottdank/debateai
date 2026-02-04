/**
 * Lightweight in-memory rate limiter for API routes.
 *
 * Per-instance (not distributed) — suitable for Vercel serverless.
 * Each function instance maintains its own window. This catches
 * abuse from single IPs without requiring Redis/external state.
 *
 * Usage:
 *   const limiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });
 *
 *   export async function GET(request: Request) {
 *     const ip = getClientIp(request);
 *     const result = limiter.check(ip);
 *     if (!result.allowed) {
 *       return new Response('Too Many Requests', {
 *         status: 429,
 *         headers: result.headers,
 *       });
 *     }
 *     // ... handle request
 *   }
 */

interface RateLimitConfig {
  /** Max requests per window. */
  maxRequests: number;
  /** Window duration in milliseconds. */
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  headers: Record<string, string>;
}

export function createRateLimiter(config: RateLimitConfig) {
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup to prevent memory leaks (every 60s)
  let lastCleanup = Date.now();
  const CLEANUP_INTERVAL = 60_000;

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }

  function check(key: string): RateLimitResult {
    cleanup();

    const now = Date.now();
    let entry = store.get(key);

    // Reset window if expired
    if (!entry || entry.resetAt <= now) {
      entry = {
        count: 0,
        resetAt: now + config.windowMs,
      };
      store.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, config.maxRequests - entry.count);
    const allowed = entry.count <= config.maxRequests;
    const resetAt = entry.resetAt;

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(config.maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
    };

    if (!allowed) {
      headers['Retry-After'] = String(Math.ceil((resetAt - now) / 1000));
    }

    return { allowed, remaining, resetAt, headers };
  }

  return { check };
}

/**
 * Extract client IP from request headers.
 * Works with Vercel (x-forwarded-for), Cloudflare (cf-connecting-ip),
 * and standard proxies.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Vercel / standard proxy
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Cloudflare
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // Vercel specific
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}
