import { PostHog } from 'posthog-node';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export async function trackEvent(distinctId: string, event: string, properties: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;

  try {
    const client = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0
    });

    client.capture({
      distinctId,
      event,
      properties
    });

    await client.shutdown();
  } catch (error) {
    console.error('Failed to track PostHog event:', error);
  }
}
