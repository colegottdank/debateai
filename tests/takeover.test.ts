import { describe, it, expect, vi, beforeEach } from 'vitest';
import { d1 } from '@/lib/d1';
import { getUserId } from '@/lib/auth-helper';
import { checkAppDisabled } from '@/lib/app-disabled';

// Hoist mocks to ensure they are available in the factory
const mocks = vi.hoisted(() => {
  const on = vi.fn();
  const finalMessage = vi.fn().mockResolvedValue({ content: [] });
  const stream = { 
    on, 
    finalMessage, 
    // Add internal properties if accessed by the SDK or test
  };
  // The create function returns the stream object
  const create = vi.fn().mockReturnValue(stream);
  return {
    on,
    finalMessage,
    stream,
    create
  };
});

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class Anthropic {
      messages = {
        stream: mocks.create
      }
    }
  }
});

vi.mock('openai', () => ({ default: class OpenAI {} })); // Remove OpenAI mock logic

vi.mock('@/lib/auth-helper', () => ({
  getUserId: vi.fn(),
  requireAuth: vi.fn()
}));

vi.mock('@/lib/d1', () => ({
  d1: {
    checkDebateMessageLimit: vi.fn(),
  }
}));

vi.mock('@/lib/app-disabled', () => ({
  checkAppDisabled: vi.fn()
}));

// Helper to create mock requests
function makeRequest(
  method: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
): Request {
  return new Request('http://localhost/api/debate/takeover', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '1.2.3.4',
      ...headers,
    },
  });
}

describe('POST /api/debate/takeover', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getUserId).mockResolvedValue('test-user-123');
    vi.mocked(checkAppDisabled).mockReturnValue(null);
    vi.mocked(d1.checkDebateMessageLimit).mockResolvedValue({ allowed: true, count: 5, limit: 10, isPremium: false });

    // Re-apply return value after resetAllMocks
    mocks.create.mockReturnValue(mocks.stream);

    // Mock stream response
    mocks.on.mockImplementation((event: string, callback: (text: string) => void) => {
      if (event === 'text') {
        callback('AI response');
      }
      return mocks.stream;
    });
    
    // Ensure finalMessage returns a promise resolving to content
    mocks.finalMessage.mockResolvedValue({ content: [] });
  });

  it('validates request body', async () => {
    const { POST } = await import('@/app/api/debate/takeover/route');
    const res = await POST(makeRequest('POST', {}));
    
    expect(res.status).toBe(400); // expect validation error
  });

  it('calls Anthropic with correct prompt', async () => {
    const { POST } = await import('@/app/api/debate/takeover/route');
    const res = await POST(makeRequest('POST', {
      debateId: 'debate-123',
      topic: 'Cats vs Dogs',
      previousMessages: [
        { role: 'user', content: 'Cats are better' },
        { role: 'ai', content: 'Dogs are loyal' }
      ],
      opponentStyle: 'Socratic'
    }));

    expect(res.status).toBe(200);
    expect(mocks.create).toHaveBeenCalled();
    const calls = mocks.create.mock.calls[0];
    expect(calls[0].model).toBe('claude-sonnet-4-20250514'); // Following CLAUDE.md
  });
});
