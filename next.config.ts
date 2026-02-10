import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // Sentry is initialized via:
  // - instrumentation.ts for server/edge (auto-detected by Next.js)
  // - SentryProvider component for client
  // No withSentryConfig wrapper needed (causes issues with Next.js 15)
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default withBundleAnalyzer(nextConfig);
