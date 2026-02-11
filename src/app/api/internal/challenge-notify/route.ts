import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { sendEmail } from '@/lib/email';
import { challengeEmail } from '@/lib/email-templates';
import { withErrorHandler, errors } from '@/lib/api-errors';

/**
 * POST /api/internal/challenge-notify
 *
 * Event-driven: called after a debate is scored, sends challenge
 * emails to previous debaters on the same topic.
 *
 * Internal endpoint — protected by INTERNAL_SECRET.
 * Called from the score route (fire-and-forget).
 *
 * Body: { topic, scorerUserId, scorerScore, scorerSnippet }
 *
 * Rules:
 * - Max 1 challenge email per user per day
 * - Only notify users with challenge_notify enabled
 * - Don't notify the scorer themselves
 */
export const POST = withErrorHandler(async (request: Request) => {
  // Protect internal endpoint
  const authHeader = request.headers.get('authorization');
  const secret = process.env.INTERNAL_SECRET || process.env.CRON_SECRET;
  if (authHeader !== `Bearer ${secret}`) {
    throw errors.unauthorized('Invalid internal secret');
  }

  const body = await request.json();
  const { topic, scorerUserId, scorerScore, scorerSnippet } = body as {
    topic: string;
    scorerUserId: string;
    scorerScore: number;
    scorerSnippet: string;
  };

  if (!topic || !scorerUserId) {
    throw errors.badRequest('topic and scorerUserId required');
  }

  // Find other users who debated the same topic (scored debates only)
  const result = await d1.query(
    `SELECT DISTINCT d.user_id, d.user_score, ep.email, ep.unsubscribe_token
     FROM debates d
     JOIN email_preferences ep ON d.user_id = ep.user_id
     WHERE d.topic = ?
       AND d.user_id != ?
       AND d.score_data IS NOT NULL
       AND ep.challenge_notify = 1
       AND ep.unsubscribed_at IS NULL
     ORDER BY d.created_at DESC
     LIMIT 10`,
    [topic, scorerUserId],
  );

  if (!result.success || !result.result || result.result.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No users to notify' });
  }

  // Check daily challenge limit (max 1/day per user)
  await d1.query(
    `CREATE TABLE IF NOT EXISTS email_challenge_log (
      user_id TEXT NOT NULL,
      sent_date TEXT NOT NULL,
      topic TEXT NOT NULL,
      PRIMARY KEY (user_id, sent_date)
    )`,
  );

  let sent = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const row of result.result) {
    const r = row as Record<string, unknown>;
    const userId = r.user_id as string;
    const userScore = (r.user_score as number) || 0;
    const email = r.email as string;
    const token = r.unsubscribe_token as string;

    // Check if already notified today
    const logCheck = await d1.query(
      `SELECT 1 FROM email_challenge_log WHERE user_id = ? AND sent_date = ?`,
      [userId, today],
    );

    if (logCheck.result && logCheck.result.length > 0) continue;

    const snippet = scorerSnippet.length > 80
      ? scorerSnippet.slice(0, 80)
      : scorerSnippet;

    const { subject, html } = challengeEmail({
      topic,
      userScore,
      otherScore: scorerScore,
      otherSnippet: snippet,
      unsubscribeToken: token,
    });

    const sendResult = await sendEmail({
      to: email,
      subject,
      html,
      tags: [
        { name: 'type', value: 'challenge' },
        { name: 'user_id', value: userId },
        { name: 'topic', value: topic.slice(0, 50) },
      ],
    });

    if (sendResult.success) {
      sent++;
      await d1.query(
        `INSERT OR IGNORE INTO email_challenge_log (user_id, sent_date, topic) VALUES (?, ?, ?)`,
        [userId, today, topic],
      );
    }
  }

  return NextResponse.json({ sent, total: result.result.length });
});
