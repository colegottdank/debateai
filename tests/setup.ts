/**
 * Vitest global setup.
 * Mocks external dependencies so unit tests run without network/services.
 */
import { vi } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn().mockResolvedValue({ userId: 'test-user-123' }),
  currentUser: vi.fn().mockResolvedValue({
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  }),
}));

// Mock D1 database
vi.mock('@/lib/d1', () => ({
  d1: {
    query: vi.fn().mockResolvedValue({ success: true, result: [] }),
    getUser: vi.fn().mockResolvedValue(null),
    upsertUser: vi.fn().mockResolvedValue({ success: true }),
    getDebate: vi.fn().mockResolvedValue({ success: false }),
    saveDebate: vi.fn().mockResolvedValue({ success: true }),
    checkDebateMessageLimit: vi.fn().mockResolvedValue({ allowed: true, count: 0, limit: 10, isPremium: false }),
    findRecentDuplicate: vi.fn().mockResolvedValue({ found: false }),
  },
}));

// Mock Stripe
vi.mock('@/lib/stripe', () => ({
  stripe: {
    customers: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      create: vi.fn().mockResolvedValue({ id: 'cus_test123' }),
    },
    subscriptions: {
      list: vi.fn().mockResolvedValue({ data: [] }),
      retrieve: vi.fn().mockResolvedValue({ id: 'sub_test123', status: 'active' }),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
      },
    },
    billingPortal: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/test' }),
      },
    },
    prices: {
      retrieve: vi.fn().mockResolvedValue({
        unit_amount: 2000,
        currency: 'usd',
        recurring: { interval: 'month' },
      }),
    },
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}));

// Mock auth-helper
vi.mock('@/lib/auth-helper', () => ({
  getUserId: vi.fn().mockResolvedValue('test-user-123'),
}));

// Mock app-disabled
vi.mock('@/lib/app-disabled', () => ({
  checkAppDisabled: vi.fn().mockReturnValue(null),
}));

// Mock Anthropic SDK as a class
vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '{"winner":"user","userScore":8,"aiScore":6,"summary":"Good debate"}' }],
      }),
    };
  }
  return { default: MockAnthropic };
});

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

// Set env vars for tests
process.env.STRIPE_PRICE_ID = 'price_test123';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test123';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.HELICONE_API_KEY = 'test-helicone-key';
// NODE_ENV is set by vitest automatically
