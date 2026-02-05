import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';

/**
 * GET /api/admin/analysis?key=<key>
 * Temporary endpoint — investigating zero-engagement debates.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  if (key !== 'forge-depth-analysis-2026-02-05') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const [zeroEngagementResult, zeroEngagementDatesResult] = await Promise.all([
      // Sample of 1-message debates (system welcome only)
      d1.query(
        `SELECT id, topic, messages, created_at, user_id,
          json_array_length(messages) as msg_count
        FROM debates
        WHERE messages IS NOT NULL AND json_array_length(messages) = 1
        ORDER BY created_at DESC
        LIMIT 15`,
        []
      ),

      // Date distribution of 1-message debates
      d1.query(
        `SELECT date(created_at) as date, COUNT(*) as count
        FROM debates
        WHERE messages IS NOT NULL AND json_array_length(messages) = 1
        GROUP BY date(created_at)
        ORDER BY date DESC
        LIMIT 20`,
        []
      ),
    ]);

    const zeroDebates = (zeroEngagementResult.result || []).map((d: Record<string, unknown>) => {
      let msgs: Array<{ role: string; content: string }> = [];
      try {
        msgs = typeof d.messages === 'string' ? JSON.parse(d.messages as string) : (d.messages as any[]) || [];
      } catch { msgs = []; }
      const firstMsg = msgs[0];
      return {
        id: d.id,
        topic: d.topic,
        userId: (d.user_id as string)?.substring(0, 12) + '...',
        firstMsgRole: firstMsg?.role || 'none',
        firstMsgPreview: firstMsg ? firstMsg.content?.substring(0, 120) : 'empty',
        createdAt: d.created_at,
      };
    });

    return NextResponse.json({
      zeroDebates,
      dateDistribution: zeroEngagementDatesResult.result || [],
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
