/**
 * POST /api/cron/rotate-topic
 *
 * Called by Vercel Cron at midnight PST (08:00 UTC) daily.
 * Selects the next daily topic using weighted random selection,
 * excluding topics shown in the last 30 days.
 *
 * Protected by CRON_SECRET env var. Vercel automatically sends
 * this header for cron invocations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { rotateDailyTopic } from '@/lib/daily-topics-db';

export const runtime = 'nodejs';
export const maxDuration = 10; // 10s timeout

export async function POST(request: NextRequest) {
  // Verify cron secret (Vercel sends this automatically)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await rotateDailyTopic(30); // 30-day cooldown

    if (!result.success || !result.topic) {
      console.error('Topic rotation failed — no topics available');
      return NextResponse.json(
        { error: 'No topics available in pool. Run seed first.' },
        { status: 500 },
      );
    }

    console.log(
      `Daily topic rotated: "${result.topic.topic}" by ${result.topic.persona} [${result.topic.category}] for ${result.date}`,
    );

    return NextResponse.json({
      rotated: true,
      date: result.date,
      topic: result.topic.topic,
      persona: result.topic.persona,
      category: result.topic.category,
    });
  } catch (error) {
    console.error('Cron rotate-topic error:', error);
    return NextResponse.json(
      { error: 'Rotation failed' },
      { status: 500 },
    );
  }
}

// Also support GET for manual testing / Vercel Cron (some configs use GET)
export async function GET(request: NextRequest) {
  return POST(request);
}
