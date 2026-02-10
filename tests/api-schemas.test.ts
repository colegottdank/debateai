/**
 * Tests for src/lib/api-schemas.ts
 *
 * Validates Zod schemas accept valid input and reject invalid input.
 */
import { describe, it, expect } from 'vitest';
import {
  createDebateSchema,
  sendMessageSchema,
  takeoverSchema,
  scoreDebateSchema,
  listDebatesQuerySchema,
  createCheckoutSchema,
} from '@/lib/api-schemas';

describe('createDebateSchema', () => {
  it('accepts valid input', () => {
    const result = createDebateSchema.safeParse({
      debateId: 'abc-123',
      topic: 'AI Ethics',
      character: 'socratic',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional fields', () => {
    const result = createDebateSchema.safeParse({
      debateId: 'abc-123',
      topic: 'AI Ethics',
      character: 'custom',
      opponentStyle: 'Aggressive philosopher',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty debateId', () => {
    const result = createDebateSchema.safeParse({
      debateId: '',
      topic: 'AI Ethics',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty topic', () => {
    const result = createDebateSchema.safeParse({
      debateId: 'abc',
      topic: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects topic over 500 chars', () => {
    const result = createDebateSchema.safeParse({
      debateId: 'abc',
      topic: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe('sendMessageSchema', () => {
  it('accepts valid input', () => {
    const result = sendMessageSchema.safeParse({
      character: 'socratic',
      topic: 'Climate Change',
      userArgument: 'My argument here',
    });
    expect(result.success).toBe(true);
  });

  it('defaults previousMessages to empty array', () => {
    const result = sendMessageSchema.safeParse({
      character: 'socratic',
      topic: 'Climate Change',
      userArgument: 'My argument',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.previousMessages).toEqual([]);
    }
  });

  it('defaults isAIAssisted to false', () => {
    const result = sendMessageSchema.safeParse({
      character: 'socratic',
      topic: 'Climate Change',
      userArgument: 'My argument',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isAIAssisted).toBe(false);
    }
  });

  it('accepts optional debateId', () => {
    const result = sendMessageSchema.safeParse({
      debateId: 'debate-123',
      character: 'socratic',
      topic: 'Climate Change',
      userArgument: 'My argument',
    });
    expect(result.success).toBe(true);
  });

  it('validates message structure in previousMessages', () => {
    const result = sendMessageSchema.safeParse({
      character: 'socratic',
      topic: 'Test',
      userArgument: 'Arg',
      previousMessages: [
        { role: 'user', content: 'Hello' },
        { role: 'ai', content: 'Hi there' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid message role', () => {
    const result = sendMessageSchema.safeParse({
      character: 'socratic',
      topic: 'Test',
      userArgument: 'Arg',
      previousMessages: [
        { role: 'invalid', content: 'Hello' },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty character', () => {
    const result = sendMessageSchema.safeParse({
      character: '',
      topic: 'Test',
      userArgument: 'Arg',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty userArgument', () => {
    const result = sendMessageSchema.safeParse({
      character: 'socratic',
      topic: 'Test',
      userArgument: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects userArgument over 10000 chars', () => {
    const result = sendMessageSchema.safeParse({
      character: 'socratic',
      topic: 'Test',
      userArgument: 'x'.repeat(10001),
    });
    expect(result.success).toBe(false);
  });
});

describe('takeoverSchema', () => {
  it('accepts valid input', () => {
    const result = takeoverSchema.safeParse({
      debateId: 'debate-123',
      topic: 'AI Ethics',
    });
    expect(result.success).toBe(true);
  });

  it('requires debateId', () => {
    const result = takeoverSchema.safeParse({
      topic: 'AI Ethics',
    });
    expect(result.success).toBe(false);
  });

  it('requires topic', () => {
    const result = takeoverSchema.safeParse({
      debateId: 'debate-123',
    });
    expect(result.success).toBe(false);
  });
});

describe('scoreDebateSchema', () => {
  it('accepts valid input with messages', () => {
    const result = scoreDebateSchema.safeParse({
      debateId: 'debate-123',
      topic: 'AI Ethics',
      messages: [
        { role: 'user', content: 'Point 1' },
        { role: 'ai', content: 'Counter 1' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('requires at least 2 messages', () => {
    const result = scoreDebateSchema.safeParse({
      debateId: 'debate-123',
      topic: 'AI Ethics',
      messages: [{ role: 'user', content: 'Only one' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional opponentName', () => {
    const result = scoreDebateSchema.safeParse({
      debateId: 'debate-123',
      topic: 'AI Ethics',
      messages: [
        { role: 'user', content: 'Point' },
        { role: 'ai', content: 'Counter' },
      ],
      opponentName: 'Socrates',
    });
    expect(result.success).toBe(true);
  });
});

describe('listDebatesQuerySchema', () => {
  it('accepts valid query params', () => {
    const result = listDebatesQuerySchema.safeParse({
      limit: '10',
      offset: '0',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(0);
    }
  });

  it('coerces string numbers', () => {
    const result = listDebatesQuerySchema.safeParse({ limit: '50' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
    }
  });

  it('uses defaults when empty', () => {
    const result = listDebatesQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
    }
  });

  it('rejects limit over 100', () => {
    const result = listDebatesQuerySchema.safeParse({ limit: '101' });
    expect(result.success).toBe(false);
  });

  it('rejects negative offset', () => {
    const result = listDebatesQuerySchema.safeParse({ offset: '-1' });
    expect(result.success).toBe(false);
  });
});

describe('createCheckoutSchema', () => {
  it('accepts valid input', () => {
    const result = createCheckoutSchema.safeParse({
      priceId: 'price_abc123',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional URLs', () => {
    const result = createCheckoutSchema.safeParse({
      priceId: 'price_abc123',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty priceId', () => {
    const result = createCheckoutSchema.safeParse({
      priceId: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid URLs', () => {
    const result = createCheckoutSchema.safeParse({
      priceId: 'price_abc123',
      successUrl: 'not a url',
    });
    expect(result.success).toBe(false);
  });
});
