/**
 * Tests for src/lib/rate-limit.ts
 *
 * Tests the rate limiter directly using TypeScript imports.
 */
import { describe, it, expect } from 'vitest';
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

describe('createRateLimiter', () => {
  it('allows requests under the limit', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    for (let i = 0; i < 5; i++) {
      const result = limiter.check('test-ip');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5 - (i + 1));
    }
  });

  it('blocks requests over the limit', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });
    for (let i = 0; i < 3; i++) limiter.check('test-ip');

    const result = limiter.check('test-ip');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('includes Retry-After header when blocked', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    limiter.check('test-ip');
    const result = limiter.check('test-ip');

    expect(result.allowed).toBe(false);
    expect(result.headers['Retry-After']).toBeDefined();
    expect(parseInt(result.headers['Retry-After'])).toBeGreaterThan(0);
  });

  it('does NOT include Retry-After when allowed', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const result = limiter.check('test-ip');

    expect(result.allowed).toBe(true);
    expect(result.headers['Retry-After']).toBeUndefined();
  });

  it('tracks different keys independently', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });

    expect(limiter.check('ip-1').allowed).toBe(true);
    expect(limiter.check('ip-2').allowed).toBe(true);
    expect(limiter.check('ip-1').allowed).toBe(false);
  });

  it('supports user-based keys', () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });

    limiter.check('user:alice');
    limiter.check('user:alice');
    expect(limiter.check('user:alice').allowed).toBe(false);
    expect(limiter.check('user:bob').allowed).toBe(true);
  });

  it('resets after window expires', async () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 50 });

    limiter.check('test-ip');
    expect(limiter.check('test-ip').allowed).toBe(false);

    await new Promise(resolve => setTimeout(resolve, 60));
    expect(limiter.check('test-ip').allowed).toBe(true);
  });

  it('returns correct standard headers', () => {
    const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });
    const result = limiter.check('test-ip');

    expect(result.headers['X-RateLimit-Limit']).toBe('10');
    expect(result.headers['X-RateLimit-Remaining']).toBe('9');
    expect(result.headers['X-RateLimit-Reset']).toBeDefined();
    expect(parseInt(result.headers['X-RateLimit-Reset'])).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('remaining decrements correctly', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });

    expect(limiter.check('ip').remaining).toBe(2);
    expect(limiter.check('ip').remaining).toBe(1);
    expect(limiter.check('ip').remaining).toBe(0);
    expect(limiter.check('ip').remaining).toBe(0);
  });

  it('handles zero maxRequests', () => {
    const limiter = createRateLimiter({ maxRequests: 0, windowMs: 60_000 });
    const result = limiter.check('test-ip');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe('getClientIp', () => {
  function makeRequest(headers: Record<string, string>): Request {
    return new Request('http://localhost', {
      headers: new Headers(headers),
    });
  }

  it('extracts IP from x-forwarded-for', () => {
    expect(getClientIp(makeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4');
  });

  it('extracts IP from cf-connecting-ip', () => {
    expect(getClientIp(makeRequest({ 'cf-connecting-ip': '10.0.0.1' }))).toBe('10.0.0.1');
  });

  it('extracts IP from x-real-ip', () => {
    expect(getClientIp(makeRequest({ 'x-real-ip': '192.168.1.1' }))).toBe('192.168.1.1');
  });

  it('prefers x-forwarded-for over cf-connecting-ip', () => {
    expect(getClientIp(makeRequest({
      'x-forwarded-for': '1.1.1.1',
      'cf-connecting-ip': '2.2.2.2',
    }))).toBe('1.1.1.1');
  });

  it('returns "unknown" when no IP headers', () => {
    expect(getClientIp(makeRequest({}))).toBe('unknown');
  });

  it('trims whitespace from forwarded IP', () => {
    expect(getClientIp(makeRequest({ 'x-forwarded-for': '  3.3.3.3 , 4.4.4.4' }))).toBe('3.3.3.3');
  });
});

describe('rateLimitResponse', () => {
  it('returns 429 status', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    limiter.check('ip');
    const result = limiter.check('ip');
    const response = rateLimitResponse(result);

    expect(response.status).toBe(429);
  });

  it('includes rate limit headers', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    limiter.check('ip');
    const result = limiter.check('ip');
    const response = rateLimitResponse(result);

    expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
    expect(response.headers.get('Retry-After')).toBeDefined();
  });

  it('returns JSON error body', async () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    limiter.check('ip');
    const result = limiter.check('ip');
    const response = rateLimitResponse(result);
    const body = JSON.parse(await response.text());

    expect(body.error).toContain('Too many requests');
  });
});

describe('dual rate limiter pattern', () => {
  it('IP limit blocks before user limit is checked', () => {
    const ipLimiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });
    const userLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });

    ipLimiter.check('1.2.3.4');
    ipLimiter.check('1.2.3.4');
    expect(ipLimiter.check('1.2.3.4').allowed).toBe(false);
    expect(userLimiter.check('user:alice').allowed).toBe(true);
  });

  it('user limit blocks even when IP has capacity', () => {
    const ipLimiter = createRateLimiter({ maxRequests: 100, windowMs: 60_000 });
    const userLimiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });

    for (let i = 0; i < 2; i++) {
      expect(ipLimiter.check('1.2.3.4').allowed).toBe(true);
      expect(userLimiter.check('user:alice').allowed).toBe(true);
    }

    expect(ipLimiter.check('1.2.3.4').allowed).toBe(true);
    expect(userLimiter.check('user:alice').allowed).toBe(false);
  });

  it('different users have independent limits', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });

    expect(limiter.check('user:alice').allowed).toBe(true);
    expect(limiter.check('user:bob').allowed).toBe(true);
    expect(limiter.check('user:alice').allowed).toBe(false);
    expect(limiter.check('user:bob').allowed).toBe(false);
  });
});
