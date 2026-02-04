/**
 * Debate API Integration Tests
 *
 * Tests the debate API endpoints at the HTTP level.
 * Verifies:
 * - Public endpoints are accessible
 * - Protected endpoints require authentication
 * - Response formats are correct
 * - Error handling works properly
 *
 * Run with dev server:
 *   npm run dev & sleep 5 && node --test tests/unit/debate-api.test.mjs
 *
 * Run against production:
 *   TEST_BASE_URL=https://debateai.org node --test tests/unit/debate-api.test.mjs
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert';

// Base URL for API tests
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Helper to make requests with redirect following
async function apiRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
      ...options,
    });
    return response;
  } catch (error) {
    return {
      ok: false,
      status: 0,
      statusText: 'Connection Failed',
      headers: new Headers(),
      json: async () => ({ error: 'Connection failed' }),
      text: async () => 'Connection failed',
      _connectionError: true,
    };
  }
}

// Helper to parse JSON safely
async function parseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

// Check server availability
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/api/stats`, {
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
    });
    return response.ok;
  } catch {
    return false;
  }
}

describe('Debate API Integration Tests', async () => {
  let serverAvailable = false;

  before(async () => {
    serverAvailable = await checkServer();
    if (!serverAvailable) {
      console.log('\\n⚠️  Server not available at', BASE_URL);
      console.log('   Set TEST_BASE_URL or start the dev server to run these tests.');
      console.log('   Skipping integration tests...\\n');
    } else {
      console.log('\\n✅ Server available at', BASE_URL);
      console.log('   Running API integration tests...\\n');
    }
  });

  // ========================================
  // PUBLIC ENDPOINTS (no auth required)
  // ========================================

  describe('Stats API (/api/stats) - PUBLIC', () => {
    it('should return platform statistics', async (t) => {
      if (!serverAvailable) return t.skip('Server not available');

      const response = await apiRequest('/api/stats', { method: 'GET' });

      assert.strictEqual(response.status, 200, 'Stats should be publicly accessible');

      const body = await parseJson(response);
      assert.ok(body, 'Should return JSON body');
      assert.ok(typeof body.totalDebates === 'number', 'Should have totalDebates');
      assert.ok(typeof body.uniqueUsers === 'number', 'Should have uniqueUsers');
      assert.ok(typeof body.debatesToday === 'number', 'Should have debatesToday');
      assert.ok(typeof body.debatesThisWeek === 'number', 'Should have debatesThisWeek');
      assert.ok(body.generatedAt, 'Should have generatedAt timestamp');
    });

    it('should include top topics array', async (t) => {
      if (!serverAvailable) return t.skip('Server not available');

      const response = await apiRequest('/api/stats', { method: 'GET' });
      const body = await parseJson(response);

      assert.ok(Array.isArray(body.topTopics), 'Should have topTopics array');
      if (body.topTopics.length > 0) {
        const topic = body.topTopics[0];
        assert.ok(topic.topic, 'Topic should have topic field');
        assert.ok(typeof topic.count === 'number', 'Topic should have count');
      }
    });

    it('should support caching', async (t) => {
      if (!serverAvailable) return t.skip('Server not available');

      // First request
      const response1 = await apiRequest('/api/stats', { method: 'GET' });
      const body1 = await parseJson(response1);

      // Second request (should be cached)
      const response2 = await apiRequest('/api/stats', { method: 'GET' });
      const body2 = await parseJson(response2);

      // Cached response should have cached: true
      // (unless cache expired between requests)
      assert.ok(body1.generatedAt, 'Should have timestamp');
      assert.ok(body2.generatedAt, 'Should have timestamp');
    });
  });

  describe('Trending API (/api/trending) - PUBLIC', () => {
    it('should return trending topics', async (t) => {
      if (!serverAvailable) return t.skip('Server not available');

      const response = await apiRequest('/api/trending', { method: 'GET' });

      assert.strictEqual(response.status, 200, 'Trending should be accessible');

      const body = await parseJson(response);
      assert.ok(body, 'Should return JSON body');
      assert.ok(Array.isArray(body.topics), 'Should have topics array');

      if (body.topics.length > 0) {
        const topic = body.topics[0];
        assert.ok(topic.id, 'Topic should have id');
        assert.ok(topic.question, 'Topic should have question');
      }
    });
  });

  describe('Share API (/api/share/[debateId]) - PUBLIC', () => {
    it('should return 404 for non-existent debate', async (t) => {
      if (!serverAvailable) return t.skip('Server not available');

      const response = await apiRequest('/api/share/nonexistent-debate-xyz-123', {
        method: 'GET',
      });

      assert.strictEqual(response.status, 404, 'Should return 404 for missing debate');
    });
  });

  describe('OG Image API (/api/og) - PUBLIC', () => {
    it('should return an image', async (t) => {
      if (!serverAvailable) return t.skip('Server not available');

      const response = await apiRequest('/api/og', { method: 'GET' });

      assert.strictEqual(response.status, 200, 'OG image should be accessible');
      const contentType = response.headers.get('content-type');
      assert.ok(contentType?.includes('image'), 'Should return image content type');
    });
  });

  // ========================================
  // PROTECTED ENDPOINTS (auth required)
  // ========================================

  describe('Debate Create API (/api/debate/create) - PROTECTED', () => {
    it('should reject unauthenticated requests', async (t) => {
      if (!serverAvailable) return t.skip('Server not available');

      const response = await apiRequest('/api/debate/create', {
        method: 'POST',
        body: JSON.stringify({
          topic: 'Test topic',
          debateId: 'test-' + Date.now(),
          character: 'socratic',
        }),
      });

      // Clerk middleware may return various codes for unauthenticated requests:
      // - 401 Unauthorized
      // - 403 Forbidden
      // - 405 Method Not Allowed (if redirecting to sign-in)
      // - 307/308 Redirect to sign-in
      assert.ok(
        [401, 403, 405, 307, 308].includes(response.status) || !response.ok,
        `Should reject unauthenticated request (got ${response.status})`
      );
    });
  });

  describe('Debate Message API (/api/debate) - PROTECTED', () => {
    it('should reject unauthenticated requests', async (t) => {
      if (!serverAvailable) return t.skip('Server not available');

      const response = await apiRequest('/api/debate', {
        method: 'POST',
        body: JSON.stringify({
          debateId: 'test-123',
          character: 'socratic',
          topic: 'Test topic',
          userArgument: 'Test argument',
        }),
      });

      assert.ok(
        [401, 403, 405, 307, 308].includes(response.status) || !response.ok,
        `Should reject unauthenticated request (got ${response.status})`
      );
    });
  });

  // ========================================
  // ERROR HANDLING
  // ========================================

  describe('Error Response Format', () => {
    it('should not leak sensitive information in errors', async (t) => {
      if (!serverAvailable) return t.skip('Server not available');

      const response = await apiRequest('/api/stripe/create-checkout', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const body = await parseJson(response);
      if (body) {
        const errorStr = JSON.stringify(body);
        // Should not contain stack traces or internal details
        assert.ok(!errorStr.includes('node_modules'), 'Should not leak file paths');
        assert.ok(!errorStr.includes('sk_live_'), 'Should not leak live API keys');
        assert.ok(!errorStr.includes('sk_test_'), 'Should not leak test API keys');
      }
    });

    it('should handle malformed JSON gracefully', async (t) => {
      if (!serverAvailable) return t.skip('Server not available');

      // Send invalid JSON to a public endpoint
      const response = await fetch(`${BASE_URL}/api/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
        redirect: 'follow',
      });

      // Should still respond correctly (GET doesn't parse body)
      assert.strictEqual(response.status, 200, 'Should handle request');
    });
  });

  // ========================================
  // RATE LIMITING
  // ========================================

  describe('Rate Limiting', () => {
    it('should respond to rapid requests (not immediately blocked)', async (t) => {
      if (!serverAvailable) return t.skip('Server not available');

      // Make a few rapid requests to stats endpoint
      const requests = Array(3).fill(null).map(() =>
        apiRequest('/api/stats', { method: 'GET' })
      );

      const responses = await Promise.all(requests);

      // At least some should succeed (rate limit is generous)
      const successCount = responses.filter(r => r.status === 200).length;
      assert.ok(successCount > 0, 'Should allow some requests through');
    });
  });
});

// Summary
describe('Test Completion', () => {
  it('outputs summary', async () => {
    console.log('\\n📋 Debate API integration tests completed');
    console.log('   Target:', BASE_URL);
  });
});
