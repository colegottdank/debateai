/**
 * Sentry error tracking utilities.
 *
 * Use these helpers to manually capture errors and add context.
 * Unhandled errors in API routes and components are automatically captured.
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Capture an error with additional context.
 * Use for caught errors where you want visibility but don't want to crash.
 */
export function captureError(
  error: Error | unknown,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    user?: { id?: string; email?: string };
    level?: 'fatal' | 'error' | 'warning' | 'info';
  }
) {
  const { tags, extra, user, level = 'error' } = context || {};

  Sentry.withScope((scope) => {
    if (tags) {
      Object.entries(tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    if (user) {
      scope.setUser(user);
    }
    scope.setLevel(level);

    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureMessage(String(error), level);
    }
  });
}

/**
 * Set user context for error tracking.
 * Call after authentication to associate errors with users.
 */
export function setUser(user: { id: string; email?: string } | null) {
  if (user) {
    Sentry.setUser(user);
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging.
 * Breadcrumbs show the trail of events leading to an error.
 */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  category?: string
) {
  Sentry.addBreadcrumb({
    message,
    data,
    category: category || 'app',
    level: 'info',
  });
}
