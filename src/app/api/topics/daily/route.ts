/**
 * GET /api/topics/daily
 *
 * Returns today's daily debate topic. If no topic has been selected
 * for today yet, triggers an on-demand rotation.
 *
 * Response is cached for 5 minutes to reduce D1 calls.
 */

import { NextResponse } from 'next/server';
import { getCurrentDailyTopic, getTopicHistory } from '@/lib/daily-topics-db';

export const runtime = 'nodejs';
export const revalidate = 300; // 5-minute ISR cache

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const includeHistory = searchParams.get('history') === '1';
  const historyLimit = parseInt(searchParams.get('historyLimit') ?? '7', 10);

  try {
    const topic = await getCurrentDailyTopic();

    if (!topic) {
      // D1 not configured or no topics in pool — return null
      return NextResponse.json(
        { topic: null, source: 'db', message: 'No topics available. Run POST /api/admin/topics/seed first.' },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
          },
        },
      );
    }

    const response: Record<string, unknown> = {
      topic: topic.topic,
      persona: topic.persona,
      personaId: topic.persona_id,
      category: topic.category,
      source: 'db',
    };

    if (includeHistory) {
      const history = await getTopicHistory(historyLimit);
      response.history = history.map((h) => ({
        date: h.shown_date,
        topic: h.topic,
        persona: h.persona,
        category: h.category,
      }));
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    });
  } catch (error) {
    console.error('Daily topic error:', error);

    // Graceful fallback — don't break the landing page
    return NextResponse.json(
      { topic: null, source: 'error', error: 'Failed to fetch daily topic' },
      { status: 200 },
    );
  }
}
