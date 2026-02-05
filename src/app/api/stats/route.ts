import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

// 10 requests per minute per IP (lightweight but no reason to hammer)
const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

// Filter conditions: exclude test users and 0-message debates (no real engagement)
const REAL_DEBATES_FILTER = "user_id != 'test-user-123' AND json_array_length(messages) > 1";
const REAL_USERS_FILTER = "user_id != 'test-user-123'";

// Cache stats for 5 minutes to avoid hammering D1
let statsCache: { data: StatsResponse; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface StatsResponse {
  totalDebates: number;
  debatesCompleted: number;
  uniqueUsers: number;
  debatesToday: number;
  debatesThisWeek: number;
  avgMessagesPerDebate: number;
  topTopics: Array<{ topic: string; count: number }>;
  generatedAt: string;
  cached: boolean;
}

/**
 * GET /api/stats
 *
 * Platform stats from D1: total debates, completions, unique users, daily/weekly volume.
 * Public endpoint, rate-limited, cached for 5 minutes.
 */
export async function GET(request: Request) {
  const rl = limiter.check(getClientIp(request));
  if (!rl.allowed) return rateLimitResponse(rl);

  // Return cache if fresh
  if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...statsCache.data, cached: true }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  }

  try {
    // Run all queries in parallel
    const [
      totalResult,
      completedResult,
      usersResult,
      todayResult,
      weekResult,
      avgMsgsResult,
      topTopicsResult,
    ] = await Promise.all([
      // Total debates (excluding test users and 0-message debates)
      d1.query(`SELECT COUNT(*) as total FROM debates WHERE ${REAL_DEBATES_FILTER}`, []),

      // Debates with score_data (completed/scored)
      d1.query(
        `SELECT COUNT(*) as total FROM debates WHERE ${REAL_DEBATES_FILTER} AND score_data IS NOT NULL AND score_data != 'null'`,
        []
      ),

      // Unique users (excluding test users)
      d1.query(`SELECT COUNT(DISTINCT user_id) as total FROM debates WHERE ${REAL_USERS_FILTER}`, []),

      // Debates created today (UTC)
      d1.query(
        `SELECT COUNT(*) as total FROM debates WHERE ${REAL_DEBATES_FILTER} AND created_at >= date('now')`,
        []
      ),

      // Debates created this week (UTC)
      d1.query(
        `SELECT COUNT(*) as total FROM debates WHERE ${REAL_DEBATES_FILTER} AND created_at >= date('now', '-7 days')`,
        []
      ),

      // Average messages per debate (only real debates with engagement)
      d1.query(
        `SELECT AVG(json_array_length(messages)) as avg_msgs FROM debates WHERE ${REAL_DEBATES_FILTER} AND messages IS NOT NULL`,
        []
      ),

      // Top 10 topics by frequency
      d1.query(
        `SELECT topic, COUNT(*) as count FROM debates WHERE ${REAL_DEBATES_FILTER} AND topic IS NOT NULL GROUP BY topic ORDER BY count DESC LIMIT 10`,
        []
      ),
    ]);

    const stats: StatsResponse = {
      totalDebates: (totalResult.result?.[0]?.total as number) || 0,
      debatesCompleted: (completedResult.result?.[0]?.total as number) || 0,
      uniqueUsers: (usersResult.result?.[0]?.total as number) || 0,
      debatesToday: (todayResult.result?.[0]?.total as number) || 0,
      debatesThisWeek: (weekResult.result?.[0]?.total as number) || 0,
      avgMessagesPerDebate: Math.round(((avgMsgsResult.result?.[0]?.avg_msgs as number) || 0) * 10) / 10,
      topTopics: (topTopicsResult.result || []).map((r: Record<string, unknown>) => ({
        topic: (r.topic as string) || 'Unknown',
        count: (r.count as number) || 0,
      })),
      generatedAt: new Date().toISOString(),
      cached: false,
    };

    // Update cache
    statsCache = { data: stats, timestamp: Date.now() };

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
