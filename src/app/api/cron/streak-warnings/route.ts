import { NextResponse } from 'next/server';
import { withErrorHandler, errors } from '@/lib/api-errors';
import { sendStreakWarnings } from '@/lib/notifications';

/**
 * POST /api/cron/streak-warnings
 *
 * Vercel Cron endpoint. Fires streak warning notifications for users
 * whose streaks will expire at midnight UTC.
 *
 * Schedule: daily at 22:00 UTC (gives users ~2h to debate).
 */
export const POST = withErrorHandler(async (request: Request) => {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    throw errors.unauthorized('Invalid cron secret');
  }

  const sent = await sendStreakWarnings();

  return NextResponse.json({
    success: true,
    warningsSent: sent,
    timestamp: new Date().toISOString(),
  });
});

// Also support GET for Vercel Cron
export const GET = POST;
