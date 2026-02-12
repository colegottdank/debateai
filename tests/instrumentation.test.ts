import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/debate/[debateId]/route';
import { trackEvent } from '@/lib/posthog-server';
import { d1 } from '@/lib/d1';

// Mock dependencies
vi.mock('@/lib/d1', () => ({
  d1: {
    getDebate: vi.fn(),
    addMessage: vi.fn(),
  }
}));

vi.mock('@/lib/auth-helper', () => ({
  getUserId: vi.fn().mockResolvedValue('user_123'),
}));

vi.mock('@/lib/api-errors', () => ({
  validateBody: vi.fn().mockResolvedValue({ message: 'Hello AI', aiTakeover: false }),
  errors: {
    badRequest: (msg) => ({ status: 400, message: msg }),
    notFound: (msg) => ({ status: 404, message: msg }),
    internal: (msg) => ({ status: 500, message: msg }),
  }
}));

vi.mock('@/lib/posthog-server', () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

// Mock Next.js Request
const createRequest = (body) => ({
  json: async () => body,
});

describe('Debate API Instrumentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should track user and AI messages', async () => {
    // Mock D1 response
    const mockDebate = {
      id: 'debate_123',
      topic: 'Cats vs Dogs',
      messages: [],
      opponent: 'Elon Musk',
      opponentStyle: 'Elon Musk'
    };
    
    // @ts-ignore
    d1.getDebate.mockResolvedValue({ success: true, debate: mockDebate });
    
    const params = Promise.resolve({ debateId: 'debate_123' });
    const req = createRequest({ message: 'Hello AI' });
    
    // Call POST
    await POST(req as any, { params });
    
    // Verify trackEvent calls
    const tracked = vi.mocked(trackEvent);
    expect(tracked).toHaveBeenCalledTimes(2);
    
    // 1. User message
    expect(tracked).toHaveBeenNthCalledWith(1, 'user_123', 'debate_message_sent', expect.objectContaining({
      debateId: 'debate_123',
      role: 'user',
      topic: 'Cats vs Dogs'
    }));
    
    // 2. AI message
    expect(tracked).toHaveBeenNthCalledWith(2, 'user_123', 'debate_ai_response_generated', expect.objectContaining({
      debateId: 'debate_123',
      role: 'ai',
      topic: 'Cats vs Dogs',
      opponent: 'Elon Musk'
    }));
  });
});
