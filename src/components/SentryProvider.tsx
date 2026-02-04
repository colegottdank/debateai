'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Initializes Sentry on the client side.
 * Must be mounted once in the root layout.
 */
export default function SentryProvider() {
  useEffect(() => {
    // Only initialize if not already done and DSN is available
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && !Sentry.getClient()) {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

        // Only enable in production
        enabled: process.env.NODE_ENV === 'production',

        // Sample rate for performance monitoring (10%)
        tracesSampleRate: 0.1,

        // Disable debug logging
        debug: false,

        // Filter out noisy errors
        ignoreErrors: [
          // Browser extension errors
          /^chrome-extension:\/\//,
          /^moz-extension:\/\//,
          // Network errors that are usually user-side
          'Failed to fetch',
          'Load failed',
          'NetworkError',
          // Resize observer spam
          'ResizeObserver loop',
        ],

        // Add release version for better debugging
        release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

        // Set environment
        environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
      });
    }
  }, []);

  return null;
}
