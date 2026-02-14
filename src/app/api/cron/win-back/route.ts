import { NextRequest, NextResponse } from 'next/server';
import { sendBatchEmails } from '@/lib/email';
import { winBackEmail } from '@/lib/email-templates';
import { d1 } from '@/lib/d1';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Get trending topic for the email content (last 7 days)
    const trendingResult = await d1.query(
      `SELECT topic, COUNT(*) as count FROM debates
       WHERE created_at >= date('now', '-7 days')
       GROUP BY topic ORDER BY count DESC LIMIT 1`
    );
    
    if (!trendingResult.success || !trendingResult.result || trendingResult.result.length === 0) {
      // Fallback if no debates recently
      return NextResponse.json({ message: 'No trending topics found' });
    }

    const topTopicRow = trendingResult.result[0] as { topic: string, count: number };
    const trendingTopic = topTopicRow.topic;
    const topicCount = topTopicRow.count;

    // 2. Get AI win % for this topic
    const statsResult = await d1.query(
      `SELECT 
         COUNT(*) as total, 
         SUM(CASE WHEN json_extract(score_data, '$.winner') = 'ai' THEN 1 ELSE 0 END) as ai_wins 
       FROM debates 
       WHERE topic = ? AND created_at >= date('now', '-7 days')`,
      [trendingTopic]
    );

    let aiWinPct = 50; // Default
    if (statsResult.success && statsResult.result && statsResult.result.length > 0) {
      const row = statsResult.result[0] as { total: number, ai_wins: number };
      if (row.total > 0) {
        aiWinPct = Math.round((row.ai_wins / row.total) * 100);
      }
    }

    // 3. Find users inactive for 7 days (last debate was between 7 and 8 days ago)
    // We target users whose MAX(created_at) is exactly in the window [now-8d, now-7d]
    // preventing us from emailing them every day.
    const recipientResult = await d1.query(
      `SELECT ep.email, ep.unsubscribe_token
       FROM email_preferences ep
       JOIN debates d ON ep.user_id = d.user_id
       WHERE ep.unsubscribed_at IS NULL
       GROUP BY ep.user_id
       HAVING MAX(d.created_at) BETWEEN date('now', '-8 days') AND date('now', '-7 days')
       LIMIT 50` 
    );
    // Limit 50 to avoid timeouts in cron

    const recipients = (recipientResult.result ?? []) as { email: string, unsubscribe_token: string }[];

    if (recipients.length === 0) {
      return NextResponse.json({ message: 'No users matching win-back criteria' });
    }

    const emails = recipients.map(r => {
      const { subject, html } = winBackEmail({
        trendingTopic,
        count: topicCount,
        aiWinPct,
        unsubscribeToken: r.unsubscribe_token,
      });

      return {
        to: r.email,
        subject,
        html,
        tags: [{ name: 'type', value: 'win_back' }],
      };
    });

    // 4. Send batch
    const result = await sendBatchEmails(emails);

    return NextResponse.json({
      sent: result.sent,
      failed: result.failed,
      recipients: recipients.length,
      topic: trendingTopic
    });

  } catch (error) {
    console.error('Win-back cron error:', error);
    return NextResponse.json({ error: 'Failed to run win-back cron' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
