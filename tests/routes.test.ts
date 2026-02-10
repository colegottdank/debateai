/**
 * API route handler tests.
 *
 * Tests route handlers with mocked dependencies.
 * Covers auth, validation, error handling, and happy paths.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { d1 } from '@/lib/d1';
import { getUserId } from '@/lib/auth-helper';
import { checkAppDisabled } from '@/lib/app-disabled';

// Helper to create mock requests
function makeRequest(
  method: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
): Request {
  return new Request('http://localhost/api/test', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
      ...headers,
    },
  });
}

// ── /api/debate/score ───────────────────────────────────────────

describe('POST /api/debate/score', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getUserId).mockResolvedValue('test-user-123');
    vi.mocked(checkAppDisabled).mockReturnValue(null);
  });

  it('returns 401 for unauthenticated requests', async () => {
    vi.mocked(getUserId).mockResolvedValue(null);

    const { POST } = await import('@/app/api/debate/score/route');
    const res = await POST(makeRequest('POST', { debateId: 'abc' }));

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('UNAUTHORIZED');
  });

  it('returns 400 for missing debateId', async () => {
    const { POST } = await import('@/app/api/debate/score/route');
    const res = await POST(makeRequest('POST', {}));

    expect(res.status).toBe(400);
  });

  it('returns 404 when debate not found', async () => {
    vi.mocked(d1.getDebate).mockResolvedValue({ success: false, error: 'Not found' });

    const { POST } = await import('@/app/api/debate/score/route');
    const res = await POST(makeRequest('POST', { debateId: 'nonexistent' }));

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('NOT_FOUND');
  });

  it('returns 403 when user does not own the debate', async () => {
    vi.mocked(d1.getDebate).mockResolvedValue({
      success: true,
      debate: {
        id: 'debate-123',
        user_id: 'other-user',
        messages: [],
        score_data: null,
        topic: 'Test',
      },
    });

    const { POST } = await import('@/app/api/debate/score/route');
    const res = await POST(makeRequest('POST', { debateId: 'debate-123' }));

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('FORBIDDEN');
  });

  it('returns cached score if already scored', async () => {
    const cachedScore = {
      winner: 'user',
      userScore: 8,
      aiScore: 6,
      summary: 'Good debate',
    };
    vi.mocked(d1.getDebate).mockResolvedValue({
      success: true,
      debate: {
        id: 'debate-123',
        user_id: 'test-user-123',
        messages: [
          { role: 'user', content: 'Point 1' },
          { role: 'ai', content: 'Counter 1' },
          { role: 'user', content: 'Point 2' },
          { role: 'ai', content: 'Counter 2' },
        ],
        score_data: { debateScore: cachedScore },
        topic: 'Test',
      },
    });

    const { POST } = await import('@/app/api/debate/score/route');
    const res = await POST(makeRequest('POST', { debateId: 'debate-123' }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.cached).toBe(true);
    expect(body.score).toEqual(cachedScore);
  });

  it('returns 400 when not enough messages to score', async () => {
    vi.mocked(d1.getDebate).mockResolvedValue({
      success: true,
      debate: {
        id: 'debate-123',
        user_id: 'test-user-123',
        messages: [
          { role: 'user', content: 'Only one exchange' },
          { role: 'ai', content: 'Response' },
        ],
        score_data: null,
        topic: 'Test',
      },
    });

    const { POST } = await import('@/app/api/debate/score/route');
    const res = await POST(makeRequest('POST', { debateId: 'debate-123' }));

    expect(res.status).toBe(400);
  });
});

// ── /api/debates ────────────────────────────────────────────────

describe('GET /api/debates', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getUserId).mockResolvedValue('test-user-123');
    vi.mocked(checkAppDisabled).mockReturnValue(null);
  });

  it('returns 401 for unauthenticated requests', async () => {
    vi.mocked(getUserId).mockResolvedValue(null);

    const { GET } = await import('@/app/api/debates/route');
    const res = await GET(new Request('http://localhost/api/debates'));

    expect(res.status).toBe(401);
  });

  it('returns debates list for authenticated users', async () => {
    vi.mocked(d1.query).mockResolvedValueOnce({
      success: true,
      result: [
        { id: 'd1', opponent: 'socratic', topic: 'AI', message_count: 6, created_at: '2026-02-10', score_data: null },
      ],
    }).mockResolvedValueOnce({
      success: true,
      result: [{ total: 1 }],
    });

    const { GET } = await import('@/app/api/debates/route');
    const res = await GET(new Request('http://localhost/api/debates?limit=20&offset=0'));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.debates).toBeDefined();
    expect(body.debates.length).toBe(1);
    expect(body.debates[0].id).toBe('d1');
  });

  it('validates query params', async () => {
    const { GET } = await import('@/app/api/debates/route');
    const res = await GET(new Request('http://localhost/api/debates?limit=999'));

    expect(res.status).toBe(400);
  });
});

// ── /api/stats ──────────────────────────────────────────────────

describe('GET /api/stats', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns platform stats', async () => {
    // Mock all the stat queries
    vi.mocked(d1.query)
      .mockResolvedValueOnce({ success: true, result: [{ total: 100 }] })  // total
      .mockResolvedValueOnce({ success: true, result: [{ total: 50 }] })   // completed
      .mockResolvedValueOnce({ success: true, result: [{ total: 25 }] })   // users
      .mockResolvedValueOnce({ success: true, result: [{ total: 5 }] })    // today
      .mockResolvedValueOnce({ success: true, result: [{ total: 30 }] })   // week
      .mockResolvedValueOnce({ success: true, result: [{ avg_msgs: 7.3 }] }) // avg msgs
      .mockResolvedValueOnce({ success: true, result: [{ topic: 'AI', count: 10 }] }); // top topics

    const { GET } = await import('@/app/api/stats/route');
    const res = await GET(new Request('http://localhost/api/stats', {
      headers: { 'x-forwarded-for': '1.2.3.4' },
    }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalDebates).toBe(100);
    expect(body.uniqueUsers).toBe(25);
    expect(body.avgMessagesPerDebate).toBe(7.3);
  });
});

// ── /api/stripe/create-checkout ─────────────────────────────────

describe('POST /api/stripe/create-checkout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(checkAppDisabled).mockReturnValue(null);
  });

  it('returns 401 for unauthenticated requests', async () => {
    // Need to mock Clerk auth directly for this route
    const clerk = await import('@clerk/nextjs/server');
    vi.mocked(clerk.auth).mockResolvedValue({ userId: null } as ReturnType<typeof clerk.auth> extends Promise<infer T> ? T : never);

    const { POST } = await import('@/app/api/stripe/create-checkout/route');
    const res = await POST(makeRequest('POST', {}));

    expect(res.status).toBe(401);
  });
});

// ── Error handling consistency ──────────────────────────────────

describe('error handling consistency', () => {
  it('all error responses have error field', async () => {
    vi.mocked(getUserId).mockResolvedValue(null);

    const { POST } = await import('@/app/api/debate/score/route');
    const res = await POST(makeRequest('POST', { debateId: 'abc' }));
    const body = await res.json();

    expect(body.error).toBeDefined();
    expect(typeof body.error).toBe('string');
  });

  it('500 errors do not leak implementation details', async () => {
    vi.mocked(getUserId).mockRejectedValue(new Error('DB crashed: password=hunter2'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const { POST } = await import('@/app/api/debate/score/route');
    const res = await POST(makeRequest('POST', { debateId: 'abc' }));
    const text = JSON.stringify(await res.json());

    expect(text).not.toContain('hunter2');
    expect(text).not.toContain('DB crashed');
    vi.mocked(console.error).mockRestore();
  });
});
