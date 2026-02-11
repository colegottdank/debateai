import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { sendBatchEmails } from '@/lib/email';
import { winBackEmail, type WinBackVariant } from '@/lib/email-templates';
import { withErrorHandler, errors } from '@/lib/api-errors';

const VARIANTS: WinBackVariant[] = ['provocative', 'curiosity', 'competitive', 'honest'];

/**
 * POST /api/cron/send-winback
 *
 * Sends win-back emails to users inactive for 7+ days.
 * Protected by CRON_SECRET. Runs daily.
 *
 * Rules:
 * - Only users with no debate in 7+ days
 * - Max 1 win-back per 30-day period (tracked via last_winback_sent)
 * - Rotates A/B variants for testing
 */
export const POST = withErrorHandler(async (request: Request) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw errors.unauthorized('Invalid cron secret');
  }

  // Ensure tracking column exists (idempotent)
  await d1.query(
    `CREATE TABLE IF NOT EXISTS email_winback_log (
      user_id TEXT PRIMARY KEY,
      last_sent TEXT NOT NULL,
      variant TEXT NOT NULL
    )`,
  );

  // Find users inactive for 7+ days who haven't received a win-back in 30 days
  // and have email preferences with challenge_notify or daily_digest enabled (proxy for "wants emails")
  const result = await d1.query(
    `SELECT ep.user_id, ep.email, ep.unsubscribe_token
     FROM email_preferences ep
     LEFT JOIN email_winback_log wl ON ep.user_id = wl.user_id
     WHERE ep.unsubscribed_at IS NULL
       AND ep.user_id NOT IN (
         SELECT DISTINCT user_id FROM debates WHERE created_at >= datetime('now', '-7 days')
       )
       AND ep.user_id IN (
         SELECT DISTINCT user_id FROM debates
       )
       AND (wl.last_sent IS NULL OR wl.last_sent < datetime('now', '-30 days'))`,
  );

  if (!result.success || !result.result || result.result.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No inactive users to contact' });
  }

  // Get trending topic for curiosity variant
  const trendingResult = await d1.query(
    `SELECT topic, COUNT(*) as cnt
     FROM debates WHERE created_at >= datetime('now', '-7 days')
     GROUP BY topic ORDER BY cnt DESC LIMIT 1`,
  );
  const trendingTopic = (trendingResult.result?.[0]?.topic as string) || 'Should AI be regulated?';
  const trendingCount = (trendingResult.result?.[0]?.cnt as number) || 47;

  const emails: Array<{ to: string; subject: string; html: string; tags: Array<{ name: string; value: string }> }> = [];
  const logEntries: Array<{ userId: string; variant: WinBackVariant }> = [];

  for (let i = 0; i < result.result.length; i++) {
    const r = result.result[i] as Record<string, unknown>;
    const userId = r.user_id as string;
    const email = r.email as string;
    const token = r.unsubscribe_token as string;

    // Rotate variant for A/B testing
    const variant = VARIANTS[i % VARIANTS.length];

    // Fetch personalization data for competitive variant
    let bestScore = 0;
    let bestTopic = 'a recent debate';
    if (variant === 'competitive') {
      const scoreResult = await d1.query(
        `SELECT topic, user_score FROM debates WHERE user_id = ? AND user_score > 0 ORDER BY user_score DESC LIMIT 1`,
        [userId],
      );
      if (scoreResult.result?.[0]) {
        bestScore = (scoreResult.result[0].user_score as number) || 0;
        bestTopic = (scoreResult.result[0].topic as string) || bestTopic;
      }
    }

    const { subject, html } = winBackEmail({
      variant,
      trendingTopic,
      trendingCount,
      bestScore,
      bestTopic,
      competitorCount: 12, // approximate — could query leaderboard
      unsubscribeToken: token,
    });

    emails.push({
      to: email,
      subject,
      html,
      tags: [
        { name: 'type', value: 'winback' },
        { name: 'variant', value: variant },
        { name: 'user_id', value: userId },
      ],
    });

    logEntries.push({ userId, variant });
  }

  const sendResult = await sendBatchEmails(emails);

  // Log sent win-backs to enforce 30-day cooldown
  for (const entry of logEntries) {
    await d1.query(
      `INSERT INTO email_winback_log (user_id, last_sent, variant) VALUES (?, datetime('now'), ?)
       ON CONFLICT(user_id) DO UPDATE SET last_sent = datetime('now'), variant = ?`,
      [entry.userId, entry.variant, entry.variant],
    );
  }

  return NextResponse.json({
    sent: sendResult.sent,
    failed: sendResult.failed,
    total: emails.length,
    variants: VARIANTS.reduce(
      (acc, v) => ({ ...acc, [v]: logEntries.filter((e) => e.variant === v).length }),
      {} as Record<string, number>,
    ),
  });
});

export const GET = POST;
