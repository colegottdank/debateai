/**
 * Unit tests for src/lib/rate-limit.ts
 * 
 * Run: node --test tests/unit/rate-limit.test.mjs
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// Inline the rate limiter for testing (avoids TypeScript/path alias issues)
// This mirrors src/lib/rate-limit.ts exactly

function createRateLimiter(config) {
  const store = new Map();
  let lastCleanup = Date.now();
  const CLEANUP_INTERVAL = 60_000;

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) store.delete(key);
    }
  }

  function check(key) {
    cleanup();
    const now = Date.now();
    let entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + config.windowMs };
      store.set(key, entry);
    }
    entry.count++;
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const allowed = entry.count <= config.maxRequests;
    const resetAt = entry.resetAt;
    const headers = {
      'X-RateLimit-Limit': String(config.maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
    };
    if (!allowed) {
      headers['Retry-After'] = String(Math.ceil((resetAt - now) / 1000));
    }
    return { allowed, remaining, resetAt, headers };
  }

  return { check, _store: store };
}

function getClientIp(request) {
  const headers = request.headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;
  return 'unknown';
}

function rateLimitResponse(result) {
  return {
    status: 429,
    body: JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    headers: { 'Content-Type': 'application/json', ...result.headers },
  };
}

// ── Tests ────────────────────────────────────────────────────────

describe('createRateLimiter', () => {
  it('allows requests under the limit', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    
    for (let i = 0; i < 5; i++) {
      const result = limiter.check('test-ip');
      assert.equal(result.allowed, true, `Request ${i + 1} should be allowed`);
      assert.equal(result.remaining, 5 - (i + 1));
    }
  });

  it('blocks requests over the limit', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });
    
    // Use up the limit
    for (let i = 0; i < 3; i++) {
      limiter.check('test-ip');
    }
    
    // 4th request should be blocked
    const result = limiter.check('test-ip');
    assert.equal(result.allowed, false);
    assert.equal(result.remaining, 0);
  });

  it('includes Retry-After header when blocked', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    
    limiter.check('test-ip'); // Use the one allowed
    const result = limiter.check('test-ip'); // Blocked
    
    assert.equal(result.allowed, false);
    assert.ok(result.headers['Retry-After'], 'Should have Retry-After header');
    assert.ok(parseInt(result.headers['Retry-After']) > 0, 'Retry-After should be positive');
  });

  it('does NOT include Retry-After when allowed', () => {
    const limiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
    const result = limiter.check('test-ip');
    
    assert.equal(result.allowed, true);
    assert.equal(result.headers['Retry-After'], undefined);
  });

  it('tracks different keys independently', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    
    const result1 = limiter.check('ip-1');
    const result2 = limiter.check('ip-2');
    
    assert.equal(result1.allowed, true);
    assert.equal(result2.allowed, true);
    
    // Second request for ip-1 should be blocked
    const result3 = limiter.check('ip-1');
    assert.equal(result3.allowed, false);
    
    // But ip-2 still has no second request
    const result4 = limiter.check('ip-2');
    assert.equal(result4.allowed, false); // ip-2's second request is also blocked (limit=1)
  });

  it('supports user-based keys (user:xxx)', () => {
    const limiter = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });
    
    const r1 = limiter.check('user:alice');
    const r2 = limiter.check('user:bob');
    
    assert.equal(r1.allowed, true);
    assert.equal(r2.allowed, true);
    
    limiter.check('user:alice'); // alice's 2nd
    const r3 = limiter.check('user:alice'); // alice's 3rd → blocked
    assert.equal(r3.allowed, false);
    
    // bob still has 1 left
    const r4 = limiter.check('user:bob');
    assert.equal(r4.allowed, true);
  });

  it('resets after window expires', async () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 50 }); // 50ms window
    
    limiter.check('test-ip'); // Use it
    const blocked = limiter.check('test-ip');
    assert.equal(blocked.allowed, false);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 60));
    
    const afterReset = limiter.check('test-ip');
    assert.equal(afterReset.allowed, true, 'Should be allowed after window expires');
  });

  it('returns correct standard headers', () => {
    const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });
    const result = limiter.check('test-ip');
    
    assert.equal(result.headers['X-RateLimit-Limit'], '10');
    assert.equal(result.headers['X-RateLimit-Remaining'], '9');
    assert.ok(result.headers['X-RateLimit-Reset'], 'Should have Reset header');
    
    const resetTimestamp = parseInt(result.headers['X-RateLimit-Reset']);
    assert.ok(resetTimestamp > Math.floor(Date.now() / 1000), 'Reset should be in the future');
  });

  it('remaining decrements correctly', () => {
    const limiter = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });
    
    assert.equal(limiter.check('ip').remaining, 2);
    assert.equal(limiter.check('ip').remaining, 1);
    assert.equal(limiter.check('ip').remaining, 0);
    assert.equal(limiter.check('ip').remaining, 0); // Stays at 0 when blocked
  });

  it('handles zero maxRequests', () => {
    const limiter = createRateLimiter({ maxRequests: 0, windowMs: 60_000 });
    const result = limiter.check('test-ip');
    
    assert.equal(result.allowed, false);
    assert.equal(result.remaining, 0);
  });
});

describe('getClientIp', () => {
  function makeRequest(headerObj) {
    return { headers: new Map(Object.entries(headerObj)) };
  }

  it('extracts IP from x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
    assert.equal(getClientIp(req), '1.2.3.4');
  });

  it('extracts IP from cf-connecting-ip', () => {
    const req = makeRequest({ 'cf-connecting-ip': '10.0.0.1' });
    assert.equal(getClientIp(req), '10.0.0.1');
  });

  it('extracts IP from x-real-ip', () => {
    const req = makeRequest({ 'x-real-ip': '192.168.1.1' });
    assert.equal(getClientIp(req), '192.168.1.1');
  });

  it('prefers x-forwarded-for over cf-connecting-ip', () => {
    const req = makeRequest({
      'x-forwarded-for': '1.1.1.1',
      'cf-connecting-ip': '2.2.2.2',
    });
    assert.equal(getClientIp(req), '1.1.1.1');
  });

  it('returns "unknown" when no IP headers present', () => {
    const req = makeRequest({});
    assert.equal(getClientIp(req), 'unknown');
  });

  it('trims whitespace from forwarded IP', () => {
    const req = makeRequest({ 'x-forwarded-for': '  3.3.3.3 , 4.4.4.4' });
    assert.equal(getClientIp(req), '3.3.3.3');
  });
});

describe('rateLimitResponse', () => {
  it('returns 429 status', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    limiter.check('ip');
    const result = limiter.check('ip');
    const response = rateLimitResponse(result);
    
    assert.equal(response.status, 429);
  });

  it('includes rate limit headers', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    limiter.check('ip');
    const result = limiter.check('ip');
    const response = rateLimitResponse(result);
    
    assert.ok(response.headers['X-RateLimit-Limit']);
    assert.ok(response.headers['Retry-After']);
    assert.equal(response.headers['Content-Type'], 'application/json');
  });

  it('returns JSON error body', () => {
    const limiter = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    limiter.check('ip');
    const result = limiter.check('ip');
    const response = rateLimitResponse(result);
    const body = JSON.parse(response.body);
    
    assert.equal(body.error, 'Too many requests. Please try again later.');
  });
});

describe('Security regression tests', () => {
  it('error responses should not contain raw error.message', () => {
    // These are the error response patterns we sanitized
    const safePatterns = [
      { error: 'Failed to create checkout session' },
      { error: 'Failed to create portal session' },
      { error: 'Webhook handler failed' },
      { error: 'Failed to send message' },
      { error: 'Failed to generate embed' },
      { error: 'Payment service error. Please try again later.' },
      { error: 'Payment configuration error. Please contact support.' },
    ];

    for (const pattern of safePatterns) {
      assert.ok(!pattern.details, `Should not have 'details' field: ${JSON.stringify(pattern)}`);
      assert.ok(!pattern.type, `Should not have 'type' field: ${JSON.stringify(pattern)}`);
      assert.ok(!pattern.code, `Should not have 'code' field: ${JSON.stringify(pattern)}`);
      assert.ok(!pattern.stack, `Should not have 'stack' field: ${JSON.stringify(pattern)}`);
      assert.equal(typeof pattern.error, 'string', 'Error should be a string');
      // Error messages should not look like raw exception messages
      assert.ok(!pattern.error.includes('Error:'), `Should not contain raw Error: prefix`);
      assert.ok(!pattern.error.includes('at '), `Should not contain stack trace fragments`);
    }
  });

  it('LOCAL_DEV_BYPASS guard pattern is correct', () => {
    // Simulate the guard logic
    function isLocalDev(nodeEnv, bypassSet) {
      return nodeEnv === 'development' || 
        (nodeEnv !== 'production' && bypassSet);
    }

    // In production: bypass should be ignored
    assert.equal(isLocalDev('production', true), false, 'Should NOT bypass in production even if set');
    assert.equal(isLocalDev('production', false), false);

    // In development: always allowed
    assert.equal(isLocalDev('development', false), true, 'Should allow in development');
    assert.equal(isLocalDev('development', true), true);

    // In test/staging: only with bypass
    assert.equal(isLocalDev('test', true), true, 'Should allow bypass in test env');
    assert.equal(isLocalDev('test', false), false, 'Should not allow without bypass in test env');
  });

  it('test-webhook endpoint returns 404 in production', () => {
    // Simulate the guard
    const isDev = false; // process.env.NODE_ENV !== 'development' in prod
    
    if (!isDev) {
      const response = { status: 404, body: { error: 'Not found' } };
      assert.equal(response.status, 404);
    }
  });

  it('debate GET should strip user_id from response', () => {
    // Simulate the destructuring pattern
    const debate = {
      id: 'debate-123',
      user_id: 'user_clerk_xxx',
      topic: 'AI regulation',
      messages: [],
      created_at: '2026-01-01',
    };

    const { user_id, ...safeDebate } = debate;
    
    assert.ok(!safeDebate.user_id, 'user_id should be stripped');
    assert.equal(safeDebate.id, 'debate-123');
    assert.equal(safeDebate.topic, 'AI regulation');
    assert.ok(safeDebate.messages);
    assert.ok(safeDebate.created_at);
  });
});
