import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { sendBatchEmails } from '@/lib/email';
import { weeklyRecapEmail, type WeeklyRecapData } from '@/lib/email-templates';
import { withErrorHandler, errors } from '@/lib/api-errors';

/**
 * POST /api/cron/send-weekly-recap
 *
 * Sends weekly recap emails every Sunday.
 * Protected by CRON_SECRET (Vercel cron).
 */
export const POST = withErrorHandler(async (request: Request) => {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    throw errors.unauthorized('Invalid cron secret');
  }

  // Get all users with weekly_recap enabled
  const prefsResult = await d1.query(
    `SELECT ep.user_id, ep.email, ep.unsubscribe_token
     FROM email_preferences ep
     WHERE ep.weekly_recap = 1 AND ep.unsubscribed_at IS NULL`,
  );

  if (!prefsResult.success || !prefsResult.result || prefsResult.result.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No subscribers' });
  }

  // Get trending topic this week
  const trendingResult = await d1.query(
    `SELECT topic, COUNT(*) as cnt
     FROM debates
     WHERE created_at >= datetime('now', '-7 days')
     GROUP BY topic ORDER BY cnt DESC LIMIT 1`,
  );
  const trendingTopic = (trendingResult.result?.[0]?.topic as string) || 'Should AI be regulated?';
  const trendingCount = (trendingResult.result?.[0]?.cnt as number) || 0;

  // Build emails
  const emails: Array<{ to: string; subject: string; html: string; tags: Array<{ name: string; value: string }> }> = [];

  for (const row of prefsResult.result) {
    const r = row as Record<string, unknown>;
    const userId = r.user_id as string;
    const email = r.email as string;
    const token = r.unsubscribe_token as string;

    // Get this user's weekly stats
    const statsResult = await d1.query(
      `SELECT
         COUNT(*) as total,
         MAX(user_score) as best_score,
         MIN(CASE WHEN user_score > 0 THEN user_score END) as worst_score
       FROM debates
       WHERE user_id = ? AND created_at >= datetime('now', '-7 days') AND score_data IS NOT NULL`,
      [userId],
    );

    const stats = statsResult.result?.[0] as Record<string, unknown> | undefined;
    const totalDebates = (stats?.total as number) || 0;
    const bestScore = (stats?.best_score as number) || 0;
    const worstScore = (stats?.worst_score as number) || 0;

    // Get best/worst topics
    let bestTopic = 'a recent debate';
    let worstTopic = 'a recent debate';
    if (totalDebates > 0) {
      const bestTopicResult = await d1.query(
        `SELECT topic FROM debates WHERE user_id = ? AND user_score = ? AND created_at >= datetime('now', '-7 days') LIMIT 1`,
        [userId, bestScore],
      );
      bestTopic = (bestTopicResult.result?.[0]?.topic as string) || bestTopic;

      if (worstScore > 0) {
        const worstTopicResult = await d1.query(
          `SELECT topic FROM debates WHERE user_id = ? AND user_score = ? AND created_at >= datetime('now', '-7 days') LIMIT 1`,
          [userId, worstScore],
        );
        worstTopic = (worstTopicResult.result?.[0]?.topic as string) || worstTopic;
      }
    }

    // Get streak from user_streaks table (if exists)
    const streakResult = await d1.query(
      `SELECT current_streak FROM user_streaks WHERE user_id = ?`,
      [userId],
    );
    const streakCount = (streakResult.result?.[0]?.current_streak as number) || 0;

    const data: WeeklyRecapData = {
      totalDebates,
      bestScore,
      bestTopic,
      worstScore,
      worstTopic,
      streakCount,
      improvement: null, // TODO: compare with previous week
      trendingTopic,
      trendingCount,
      unsubscribeToken: token,
    };

    const { subject, html } = weeklyRecapEmail(data);
    emails.push({
      to: email,
      subject,
      html,
      tags: [
        { name: 'type', value: 'weekly_recap' },
        { name: 'user_id', value: userId },
      ],
    });
  }

  const result = await sendBatchEmails(emails);

  return NextResponse.json({
    sent: result.sent,
    failed: result.failed,
    total: emails.length,
  });
});

// Also support GET for Vercel cron
export const GET = POST;
