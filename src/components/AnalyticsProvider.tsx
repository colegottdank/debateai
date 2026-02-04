'use client';

import { useEffect } from 'react';
import { track as vercelTrack } from '@vercel/analytics';
import { registerProvider } from '@/lib/analytics';

/**
 * Wires our custom analytics abstraction to Vercel Analytics.
 * All existing track() calls throughout the app automatically
 * flow to Vercel's dashboard. Mount once in the root layout.
 */
export default function AnalyticsProvider() {
  useEffect(() => {
    registerProvider((event, properties) => {
      // Our analytics events only use strings, numbers, booleans — all valid
      // for Vercel Analytics. Cast through unknown to satisfy the type boundary.
      vercelTrack(
        event,
        properties as Record<string, string | number | boolean | null>
      );
    });
  }, []);

  return null;
}
