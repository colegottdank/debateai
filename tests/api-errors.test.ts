/**
 * Tests for src/lib/api-errors.ts
 *
 * Validates the standardized error handling utilities:
 * - Error response formatting
 * - Status codes and error codes
 * - Zod validation helper
 * - withErrorHandler wrapper
 * - Rate limit headers
 */
import { describe, it, expect, vi } from 'vitest';
import { NextResponse } from 'next/server';
import {
  apiError,
  errors,
  ApiErrorCodes,
  validateBody,
  withErrorHandler,
  withRateLimitHeaders,
} from '@/lib/api-errors';

// ── apiError ────────────────────────────────────────────────────

describe('apiError', () => {
  it('returns NextResponse with correct status', () => {
    const res = apiError(400, 'Bad request');
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(400);
  });

  it('includes error message in body', async () => {
    const res = apiError(404, 'Not found');
    const body = await res.json();
    expect(body.error).toBe('Not found');
  });

  it('includes error code when provided', async () => {
    const res = apiError(401, 'Unauthorized', { code: ApiErrorCodes.UNAUTHORIZED });
    const body = await res.json();
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('includes details when provided', async () => {
    const res = apiError(400, 'Validation failed', {
      code: ApiErrorCodes.VALIDATION_ERROR,
      details: { fields: [{ path: 'email', message: 'required' }] },
    });
    const body = await res.json();
    expect(body.details).toEqual({ fields: [{ path: 'email', message: 'required' }] });
  });

  it('adds rate limit headers when provided', () => {
    const res = apiError(429, 'Rate limited', {
      rateLimit: { limit: 10, remaining: 0, reset: 1700000000 },
    });
    expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    expect(res.headers.get('X-RateLimit-Reset')).toBe('1700000000');
  });

  it('omits code and details when not provided', async () => {
    const res = apiError(500, 'Server error');
    const body = await res.json();
    expect(body).toEqual({ error: 'Server error' });
    expect(body.code).toBeUndefined();
    expect(body.details).toBeUndefined();
  });
});

// ── errors helpers ──────────────────────────────────────────────

describe('errors helpers', () => {
  it('badRequest returns 400', async () => {
    const res = errors.badRequest('Invalid input');
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('badRequest includes details', async () => {
    const res = errors.badRequest('Validation failed', { field: 'email' });
    const body = await res.json();
    expect(body.details).toEqual({ field: 'email' });
  });

  it('unauthorized returns 401', async () => {
    const res = errors.unauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Authentication required');
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('unauthorized accepts custom message', async () => {
    const res = errors.unauthorized('Token expired');
    const body = await res.json();
    expect(body.error).toBe('Token expired');
  });

  it('forbidden returns 403', async () => {
    const res = errors.forbidden();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN');
  });

  it('notFound returns 404', async () => {
    const res = errors.notFound('Debate not found');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Debate not found');
    expect(body.code).toBe('NOT_FOUND');
  });

  it('rateLimited returns 429 with headers', async () => {
    const res = errors.rateLimited({ limit: 5, remaining: 0, reset: 1700000000 });
    expect(res.status).toBe(429);
    expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    const body = await res.json();
    expect(body.code).toBe('RATE_LIMITED');
  });

  it('messageLimit returns 429 with upgrade info', async () => {
    const res = errors.messageLimit(10, 10);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.code).toBe('MESSAGE_LIMIT');
    expect(body.details?.current).toBe(10);
    expect(body.details?.limit).toBe(10);
    expect(body.details?.upgrade_required).toBe(true);
  });

  it('internal returns 500', async () => {
    const res = errors.internal();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
    expect(body.code).toBe('INTERNAL_ERROR');
  });

  it('disabled returns 503', async () => {
    const res = errors.disabled();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.code).toBe('APP_DISABLED');
  });
});

// ── validateBody ────────────────────────────────────────────────

describe('validateBody', () => {
  it('validates and returns parsed data', async () => {
    const { z } = await import('zod');
    const schema = z.object({ name: z.string(), age: z.number() });
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: 'Alice', age: 30 }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await validateBody(request, schema);
    expect(data).toEqual({ name: 'Alice', age: 30 });
  });

  it('throws on invalid JSON', async () => {
    const { z } = await import('zod');
    const schema = z.object({ name: z.string() });
    const request = new Request('http://localhost', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    });

    await expect(validateBody(request, schema)).rejects.toBeInstanceOf(NextResponse);
  });

  it('throws on schema violation with field details', async () => {
    const { z } = await import('zod');
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });
    const request = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ name: '', email: 'not-email' }),
      headers: { 'Content-Type': 'application/json' },
    });

    try {
      await validateBody(request, schema);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(NextResponse);
      const body = await (err as NextResponse).json();
      expect(body.error).toBe('Validation failed');
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.details?.fields).toBeDefined();
      expect(body.details.fields.length).toBeGreaterThan(0);
    }
  });
});

// ── withErrorHandler ────────────────────────────────────────────

describe('withErrorHandler', () => {
  it('passes through successful responses', async () => {
    const handler = withErrorHandler(async () => {
      return NextResponse.json({ ok: true });
    });

    const res = await handler(new Request('http://localhost'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('catches thrown NextResponse errors and returns them', async () => {
    const handler = withErrorHandler(async () => {
      throw errors.notFound('Gone');
    });

    const res = await handler(new Request('http://localhost'));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Gone');
  });

  it('catches unknown errors and returns 500', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = withErrorHandler(async () => {
      throw new Error('Unexpected crash');
    });

    const res = await handler(new Request('http://localhost'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Internal server error');
    expect(body.code).toBe('INTERNAL_ERROR');
    consoleSpy.mockRestore();
  });

  it('does not leak error details in 500 responses', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = withErrorHandler(async () => {
      throw new Error('Database connection failed: password=secret123');
    });

    const res = await handler(new Request('http://localhost'));
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('secret123');
    expect(JSON.stringify(body)).not.toContain('Database connection');
    consoleSpy.mockRestore();
  });
});

// ── withRateLimitHeaders ────────────────────────────────────────

describe('withRateLimitHeaders', () => {
  it('adds rate limit headers to response', () => {
    const res = NextResponse.json({ data: 'test' });
    const enhanced = withRateLimitHeaders(res, {
      limit: 100,
      remaining: 99,
      reset: 1700000000,
    });

    expect(enhanced.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(enhanced.headers.get('X-RateLimit-Remaining')).toBe('99');
    expect(enhanced.headers.get('X-RateLimit-Reset')).toBe('1700000000');
  });
});
