/**
 * Next.js instrumentation hook.
 * Auto-detected by Next.js — runs once when the server starts.
 * Initializes Sentry for server-side and edge error tracking.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs');

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: process.env.NODE_ENV === 'production',
      tracesSampleRate: 0.1,
      debug: false,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      environment: process.env.VERCEL_ENV || 'development',

      // Capture unhandled promise rejections
      integrations: [
        Sentry.captureConsoleIntegration({ levels: ['error'] }),
      ],

      // Don't send PII by default
      sendDefaultPii: false,

      // Filter noisy server-side errors
      ignoreErrors: [
        'NEXT_NOT_FOUND',
        'NEXT_REDIRECT',
      ],

      // Before sending, strip sensitive data
      beforeSend(event) {
        // Remove any query params that might contain tokens
        if (event.request?.url) {
          try {
            const url = new URL(event.request.url);
            url.searchParams.delete('token');
            url.searchParams.delete('key');
            event.request.url = url.toString();
          } catch {
            // URL parsing failed, leave as-is
          }
        }
        return event;
      },
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs');

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      enabled: process.env.NODE_ENV === 'production',
      tracesSampleRate: 0.05, // Lower for edge
      debug: false,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
      environment: process.env.VERCEL_ENV || 'development',
    });
  }
}
