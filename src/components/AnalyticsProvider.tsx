'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { track as vercelTrack } from '@vercel/analytics';
import { registerProvider, track } from '@/lib/analytics';
import { captureUtmParams, getAttributionContext } from '@/lib/utm';
import posthog from '@/lib/posthog';

const SESSION_KEY = 'debateai_session_tracked';
const DEBUG = process.env.NEXT_PUBLIC_POSTHOG_DEBUG === 'true';

/**
 * Inner component that uses search params and pathname.
 * Must be wrapped in Suspense to avoid de-opting static pages.
 */
function AnalyticsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track pageviews on route change
  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      
      if (DEBUG) {
        console.log('[PostHog] Capturing $pageview:', url);
      }
      
      posthog.capture('$pageview', {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    // Capture UTM params from URL on mount
    const utm = captureUtmParams();

    // Register provider that enriches events with attribution context
    registerProvider((event, properties) => {
      // Get stored UTM/referrer context
      const attribution = getAttributionContext();

      // Merge attribution with event properties
      const enrichedProps = {
        ...attribution,
        ...properties,
      };

      // Filter out undefined values for cleaner data
      const cleanProps: Record<string, string | number | boolean | null> = {};
      for (const [key, value] of Object.entries(enrichedProps)) {
        if (value !== undefined) {
          cleanProps[key] = value as string | number | boolean | null;
        }
      }

      // Dispatch to Vercel
      vercelTrack(event, cleanProps);

      // Dispatch to PostHog
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        if (DEBUG) {
          console.log('[PostHog] Capturing event:', event, cleanProps);
        }
        posthog.capture(event, cleanProps);
      } else if (DEBUG) {
        console.log('[PostHog] Skipped capture - no API key:', event, cleanProps);
      }
    });

    // Track session start once per session
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      track('session_started', {
        landing_page: utm.landing_page || window.location.pathname,
      });
    }
  }, []);

  return null;
}

/**
 * Wires our custom analytics abstraction to Vercel Analytics and PostHog.
 * Also captures UTM parameters on first page load.
 */
export default function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  );
}
