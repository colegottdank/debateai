'use client';

import { useEffect } from 'react';
import { track as vercelTrack } from '@vercel/analytics';
import { registerProvider, track } from '@/lib/analytics';
import { captureUtmParams, getAttributionContext } from '@/lib/utm';

const SESSION_KEY = 'debateai_session_tracked';

/**
 * Wires our custom analytics abstraction to Vercel Analytics.
 * Also captures UTM parameters on first page load.
 *
 * All existing track() calls throughout the app automatically
 * flow to Vercel's dashboard with attribution context attached.
 * Mount once in the root layout.
 */
export default function AnalyticsProvider() {
  useEffect(() => {
    // Capture UTM params from URL on mount
    const utm = captureUtmParams();

    // Register provider that enriches events with attribution context
    registerProvider((event, properties) => {
      // Get stored UTM/referrer context
      const attribution = getAttributionContext();

      // Merge attribution with event properties
      // Event-specific properties take precedence
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

      vercelTrack(event, cleanProps);
    });

    // Track session start once per session (for acquisition cohorts)
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      track('session_started', {
        landing_page: utm.landing_page || window.location.pathname,
      });
    }
  }, []);

  return null;
}
