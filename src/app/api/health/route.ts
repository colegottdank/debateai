import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring and uptime services.
 * Returns service status with dependency checks.
 *
 * Response:
 *   200 — all systems operational
 *   503 — one or more dependencies down
 */
export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: 'ok' | 'error'; latencyMs?: number; error?: string }> = {};

  // Check D1 database
  try {
    const dbStart = Date.now();
    const result = await d1.query('SELECT 1 as ping', []);
    checks.database = {
      status: result.success ? 'ok' : 'error',
      latencyMs: Date.now() - dbStart,
    };
  } catch {
    checks.database = {
      status: 'error',
      error: 'Database unreachable',
    };
  }

  // Check required env vars (don't leak values)
  const requiredEnvVars = [
    'ANTHROPIC_API_KEY',
    'HELICONE_API_KEY',
    'STRIPE_PRICE_ID',
    'AGENTMAIL_API_KEY',
    'NEXT_PUBLIC_POSTHOG_KEY',
    'NEXT_PUBLIC_POSTHOG_HOST',
    // Critical Infrastructure
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_D1_DATABASE_ID',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_EMAIL',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY',
  ];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  checks.config = {
    status: missingVars.length === 0 ? 'ok' : 'error',
    ...(missingVars.length > 0 && { error: `Missing: ${missingVars.join(', ')}` }),
  };

  // Overall status
  const allOk = Object.values(checks).every((c) => c.status === 'ok');
  const totalLatency = Date.now() - start;

  const response = {
    status: allOk ? 'healthy' : 'degraded',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    latencyMs: totalLatency,
    checks,
  };

  return NextResponse.json(response, {
    status: allOk ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
