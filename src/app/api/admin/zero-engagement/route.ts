import { NextRequest, NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';

// TEMPORARY: Zero-engagement analysis endpoint
// Remove after data collection — forge-ze-2026-02-05
const ANALYSIS_KEY = 'forge-ze-2026-02-05';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== ANALYSIS_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get all debates with only 1 message (system welcome only = zero engagement)
  const zeroEngagement = await d1.query(`
    SELECT 
      d.id,
      d.user_id,
      d.topic,
      d.created_at,
      d.status,
      COUNT(m.id) as message_count
    FROM debates d
    LEFT JOIN messages m ON m.debate_id = d.id
    GROUP BY d.id
    HAVING message_count <= 1
    ORDER BY d.created_at DESC
  `);

  if (!zeroEngagement.success || !zeroEngagement.result) {
    return NextResponse.json({ error: 'Query failed', details: zeroEngagement.error }, { status: 500 });
  }

  // Aggregate by user_id
  const userCounts: Record<string, number> = {};
  for (const row of zeroEngagement.result) {
    const uid = (row.user_id as string) || 'unknown';
    userCounts[uid] = (userCounts[uid] || 0) + 1;
  }

  // Sort users by count descending
  const userBreakdown = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([userId, count]) => ({ userId, count }));

  // Get sample topics
  const sampleTopics = zeroEngagement.result.slice(0, 30).map(r => ({
    id: r.id,
    userId: r.user_id,
    topic: r.topic,
    createdAt: r.created_at,
    status: r.status,
    messageCount: r.message_count,
  }));

  return NextResponse.json({
    totalZeroEngagement: zeroEngagement.result.length,
    uniqueUsers: Object.keys(userCounts).length,
    userBreakdown,
    sampleTopics,
  });
}
