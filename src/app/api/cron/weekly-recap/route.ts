import { NextRequest, NextResponse } from 'next/server';
import { getWeeklyRecapRecipients } from '@/lib/email-preferences';
import { sendBatchEmails } from '@/lib/email';
import { weeklyRecapEmail } from '@/lib/email-templates';
import { d1 } from '@/lib/d1';
import { getStreak } from '@/lib/streaks';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get global trending topic (last 7 days)
    const trendingResult = await d1.query(
      `SELECT topic, COUNT(*) as count FROM debates
       WHERE created_at >= date('now', '-7 days')
       GROUP BY topic ORDER BY count DESC LIMIT 1`
    );
    const trendingTopic = (trendingResult.result?.[0]?.topic as string) || 'Artificial Intelligence';

    // 2. Get recipients (limit 50 to fit in time/batch)
    const recipients = await getWeeklyRecapRecipients(50, 0);
    if (recipients.length === 0) {
      return NextResponse.json({ message: 'No recipients' });
    }

    const emails = [];

    for (const r of recipients) {
      // Get User Stats
      // Parallelize queries for speed
      const [totalResult, bestResult, streakResult] = await Promise.all([
        d1.query(
          `SELECT COUNT(*) as total FROM debates WHERE user_id = ? AND created_at >= date('now', '-7 days')`,
          [r.user_id]
        ),
        d1.query(
          `SELECT topic, json_extract(score_data, '$.debateScore') as score 
           FROM debates 
           WHERE user_id = ? AND created_at >= date('now', '-7 days') AND score_data IS NOT NULL 
           ORDER BY score DESC LIMIT 1`,
          [r.user_id]
        ),
        getStreak(r.user_id)
      ]);

      const totalDebates = (totalResult.result?.[0]?.total as number) || 0;
      const bestRow = bestResult.result?.[0] as Record<string, any> | undefined;
      const bestScore = (bestRow?.score as number) || 0;
      const bestTopic = (bestRow?.topic as string) || '';
      const streakCount = streakResult.currentStreak;

      // Create email content
      const { subject, html } = weeklyRecapEmail({
        stats: {
          totalDebates,
          bestScore,
          bestTopic,
          streakCount,
        },
        trendingTopic,
        unsubscribeToken: r.unsubscribe_token,
      });

      emails.push({
        to: r.email,
        subject,
        html,
        tags: [{ name: 'type', value: 'weekly_recap' }],
      });
    }

    // Send batch
    const result = await sendBatchEmails(emails);

    return NextResponse.json({
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    console.error('Weekly recap error:', error);
    return NextResponse.json({ error: 'Failed to send weekly recap' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
