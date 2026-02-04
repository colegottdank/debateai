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
      vercelTrack(event, properties);
    });
  }, []);

  return null;
}
