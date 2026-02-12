import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (key) {
    posthog.init(key, {
      api_host: host,
      person_profiles: 'always', // Track both anonymous and identified users
      capture_pageview: false, // Handle manually to match our existing analytics abstraction
      session_recording: {
        maskAllInputs: false,
      },
    });
  }
}

export default posthog;
