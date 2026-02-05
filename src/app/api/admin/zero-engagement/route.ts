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

  // Messages are stored as JSON array in debates.messages column
  // Zero engagement = debates where messages has only 1 entry (system welcome)
  const allDebates = await d1.query(`
    SELECT id, user_id, topic, created_at, status, messages
    FROM debates
    ORDER BY created_at DESC
  `);

  if (!allDebates.success || !allDebates.result) {
    return NextResponse.json({ error: 'Query failed', details: allDebates.error }, { status: 500 });
  }

  interface DebateRow {
    id: string;
    user_id: string;
    topic: string;
    created_at: string;
    status: string;
    messages: string;
  }

  const zeroEngagement: Array<{
    id: string;
    userId: string;
    topic: string;
    createdAt: string;
    status: string;
    messageCount: number;
    userMessageCount: number;
    roles: string[];
  }> = [];

  for (const row of allDebates.result as unknown as DebateRow[]) {
    let msgs: Array<{ role: string; content: string }> = [];
    try {
      msgs = typeof row.messages === 'string' ? JSON.parse(row.messages) : (row.messages || []);
    } catch {
      msgs = [];
    }

    const userMsgCount = msgs.filter(m => m.role === 'user').length;

    // Zero engagement: user never sent a message
    if (userMsgCount === 0) {
      zeroEngagement.push({
        id: row.id,
        userId: row.user_id,
        topic: row.topic,
        createdAt: row.created_at,
        status: row.status,
        messageCount: msgs.length,
        userMessageCount: userMsgCount,
        roles: msgs.map(m => m.role),
      });
    }
  }

  // Aggregate by user_id
  const userCounts: Record<string, number> = {};
  for (const d of zeroEngagement) {
    userCounts[d.userId] = (userCounts[d.userId] || 0) + 1;
  }

  const userBreakdown = Object.entries(userCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([userId, count]) => ({ userId, count }));

  return NextResponse.json({
    totalDebates: allDebates.result.length,
    totalZeroEngagement: zeroEngagement.length,
    percentZeroEngagement: ((zeroEngagement.length / allDebates.result.length) * 100).toFixed(1),
    uniqueUsersWithZeroEngagement: Object.keys(userCounts).length,
    userBreakdown,
    sampleTopics: zeroEngagement.slice(0, 40).map(({ id, userId, topic, createdAt, status, messageCount, roles }) => ({
      id, userId, topic, createdAt, status, messageCount, roles,
    })),
  });
}
