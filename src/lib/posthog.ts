import posthog from 'posthog-js';

if (typeof window !== 'undefined') {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  const debug = process.env.NEXT_PUBLIC_POSTHOG_DEBUG === 'true';

  if (key) {
    posthog.init(key, {
      api_host: host,
      person_profiles: 'always', // Track both anonymous and identified users
      capture_pageview: false, // Handle manually to match our existing analytics abstraction
      session_recording: {
        maskAllInputs: false,
      },
      loaded: (posthogInstance) => {
        if (debug) {
          console.log('[PostHog] Initialized successfully');
          // @ts-expect-error - debug is internal property
          posthogInstance.debug();
        }
      },
    });
  } else if (debug) {
    console.warn('[PostHog] No API key found - events will not be sent');
  }
}

export default posthog;
