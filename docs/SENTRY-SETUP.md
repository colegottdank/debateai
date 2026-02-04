# Sentry Error Monitoring Setup

## Overview

DebateAI uses [Sentry](https://sentry.io) for error monitoring. The integration captures:
- Unhandled errors in React components (client-side)
- API route errors (server-side)
- Edge middleware errors

## Configuration

### Environment Variables

Add these to your Vercel project settings (or `.env.local` for development):

```env
# Required: Sentry DSN (get from Sentry dashboard → Project Settings → Client Keys)
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Optional: Auth token for source map uploads (improves stack traces)
SENTRY_AUTH_TOKEN=sntrys_xxx

# Automatically set by Vercel (used for release tagging)
# VERCEL_GIT_COMMIT_SHA
# VERCEL_ENV
# NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA
# NEXT_PUBLIC_VERCEL_ENV
```

### How It Works

1. **Client-side**: `SentryProvider` component initializes Sentry in the browser
2. **Server-side**: `instrumentation.ts` loads `sentry.server.config.ts`
3. **Edge runtime**: `instrumentation.ts` loads `sentry.edge.config.ts`
4. **Error boundaries**: `error.tsx` and `global-error.tsx` capture and report React errors

### Files

```
├── instrumentation.ts          # Next.js instrumentation hook
├── sentry.server.config.ts     # Server-side Sentry init
├── sentry.edge.config.ts       # Edge runtime Sentry init
├── src/
│   ├── app/
│   │   ├── error.tsx           # Segment error boundary
│   │   └── global-error.tsx    # Global error boundary
│   ├── components/
│   │   └── SentryProvider.tsx  # Client-side Sentry init
│   └── lib/
│       └── sentry.ts           # Helper utilities
```

## Usage

### Automatic Error Capture

Unhandled errors are automatically captured. No code changes needed.

### Manual Error Capture

For caught errors where you want visibility:

```typescript
import { captureError } from '@/lib/sentry';

try {
  await riskyOperation();
} catch (error) {
  captureError(error, {
    tags: { feature: 'debate' },
    extra: { debateId: '123' },
    level: 'warning', // or 'error', 'fatal'
  });
  // Handle gracefully...
}
```

### User Context

After authentication, associate errors with users:

```typescript
import { setUser } from '@/lib/sentry';

// After login
setUser({ id: user.id, email: user.email });

// After logout
setUser(null);
```

### Breadcrumbs

Add context for debugging:

```typescript
import { addBreadcrumb } from '@/lib/sentry';

addBreadcrumb('Started debate', { topic: 'AI Ethics' }, 'debate');
```

## Sampling

- **Error sampling**: 100% (all errors captured)
- **Performance sampling**: 10% (tracesSampleRate: 0.1)

Adjust in the config files if needed.

## Filtered Errors

These are ignored (noisy, not actionable):
- Browser extension errors (`chrome-extension://`, `moz-extension://`)
- Network errors (`Failed to fetch`, `Load failed`, `NetworkError`)
- ResizeObserver loop errors

## Free Tier Limits

Sentry free tier includes:
- 5,000 errors/month
- 10,000 performance units/month
- 1GB attachments

Monitor usage in Sentry dashboard → Usage Stats.
