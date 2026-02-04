import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Sentry is initialized via:
  // - instrumentation.ts for server/edge (auto-detected by Next.js)
  // - SentryProvider component for client
  // No withSentryConfig wrapper needed (causes issues with Next.js 15)
};

export default nextConfig;
