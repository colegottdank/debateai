import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextResponse } from 'next/server';

// Mock d1
const mockQuery = vi.fn();
vi.mock('@/lib/d1', () => ({
  d1: {
    query: (...args: any[]) => mockQuery(...args),
  },
}));

// Mock rate limiter
vi.mock('@/lib/rate-limit', () => ({
  createRateLimiter: () => ({
    check: () => ({ allowed: true, headers: {} }),
  }),
  getClientIp: () => '127.0.0.1',
  rateLimitResponse: () => new NextResponse('Rate Limited', { status: 429 }),
}));

// Mock API errors wrapper to just pass through for testing logic
vi.mock('@/lib/api-errors', () => ({
  withErrorHandler: (handler: any) => handler,
}));

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default success mock
    mockQuery.mockResolvedValue({
      success: true,
      result: [{ total: 100 }], // Generic success response
    });
  });

  it('should return 200 and stats when all queries succeed', async () => {
    // Setup specific mocks for the 7 queries if needed, or generic is fine for now
    // We just want to check structure
    mockQuery
      .mockResolvedValueOnce({ success: true, result: [{ total: 100 }] }) // total
      .mockResolvedValueOnce({ success: true, result: [{ total: 50 }] })  // completed
      .mockResolvedValueOnce({ success: true, result: [{ total: 20 }] })  // users
      .mockResolvedValueOnce({ success: true, result: [{ total: 5 }] })   // today
      .mockResolvedValueOnce({ success: true, result: [{ total: 10 }] })  // week
      .mockResolvedValueOnce({ success: true, result: [{ avg_msgs: 4.5 }] }) // avg
      .mockResolvedValueOnce({ success: true, result: [{ topic: 'Politics', count: 10 }] }); // topics

    const request = new Request('http://localhost/api/stats');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalDebates).toBe(100);
    expect(data.debatesCompleted).toBe(50);
    expect(data.completionRate).toBe(0.5);
    expect(data.avgMessagesPerDebate).toBe(4.5);
  });

  it('should return 200 and partial stats when some queries fail', async () => {
    // Simulate failure for "completed" and "avg msgs"
    mockQuery
      .mockResolvedValueOnce({ success: true, result: [{ total: 100 }] }) // total
      .mockRejectedValueOnce(new Error('D1 Timeout'))                     // completed (FAIL)
      .mockResolvedValueOnce({ success: true, result: [{ total: 20 }] })  // users
      .mockResolvedValueOnce({ success: true, result: [{ total: 5 }] })   // today
      .mockResolvedValueOnce({ success: true, result: [{ total: 10 }] })  // week
      .mockRejectedValueOnce(new Error('D1 Rate Limit'))                  // avg (FAIL)
      .mockResolvedValueOnce({ success: true, result: [{ topic: 'Politics', count: 10 }] }); // topics

    const request = new Request('http://localhost/api/stats');
    const response = await GET(request);
    
    // With Promise.all (current code), this would throw/fail. 
    // We expect it to pass after our fix.
    // If the code isn't fixed yet, this test will fail (or throw).
    
    // We'll catch if it throws to verify behavior before fix
    try {
        const data = await response.json();
        expect(response.status).toBe(200);
        expect(data.totalDebates).toBe(100);
        expect(data.debatesCompleted).toBe(0); // Fallback
        expect(data.avgMessagesPerDebate).toBe(0); // Fallback
        expect(data.uniqueUsers).toBe(20);
    } catch (e) {
        // Expected failure before fix
        throw e; 
    }
  });
});
