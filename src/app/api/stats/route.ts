import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { withErrorHandler } from '@/lib/api-errors';

// 10 requests per minute per IP (lightweight but no reason to hammer)
const limiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });

// Filter conditions: exclude test users and short/empty messages (no real engagement)
// Optimized: use LENGTH instead of json_array_length to avoid full table scan JSON parsing
const REAL_DEBATES_FILTER = "user_id != 'test-user-123' AND LENGTH(messages) > 20";
const REAL_USERS_FILTER = "user_id != 'test-user-123'";

// Cache stats for 5 minutes to avoid hammering D1
let statsCache: { data: StatsResponse; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface StatsResponse {
  totalDebates: number;
  debatesCompleted: number;
  completionRate: number;
  uniqueUsers: number;
  debatesToday: number;
  debatesThisWeek: number;
  avgMessagesPerDebate: number;
  topTopics: Array<{ topic: string; count: number }>;
  generatedAt: string;
  cached: boolean;
}

export const revalidate = 300; // Cache for 5 minutes at edge

/**
 * GET /api/stats
 *
 * Platform stats from D1: total debates, completions, unique users, daily/weekly volume.
 * Public endpoint, rate-limited, cached for 5 minutes.
 */
export const GET = withErrorHandler(async (request: Request) => {
  const rl = limiter.check(getClientIp(request));
  if (!rl.allowed) {
    return rateLimitResponse(rl) as unknown as NextResponse;
  }

  // Return cache if fresh (disabled in tests)
  if (process.env.NODE_ENV !== 'test' && statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
    return NextResponse.json({ ...statsCache.data, cached: true }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300',
        ...rl.headers,
      },
    });
  }

  // Helper to safely unwrap settled promises
  const unwrap = (result: PromiseSettledResult<any>, fallback: any, label: string) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.error(`[Stats] Query failed for ${label}:`, result.reason);
    return fallback;
  };

  const emptyD1Result = { result: [] };

  // Run all queries in parallel safely
  const results = await Promise.allSettled([
    // Total debates
    d1.query(`SELECT COUNT(*) as total FROM debates WHERE ${REAL_DEBATES_FILTER}`, []),

    // Completed debates
    d1.query(
      `SELECT COUNT(*) as total FROM debates WHERE ${REAL_DEBATES_FILTER} AND score_data IS NOT NULL AND json_extract(score_data, '$.debateScore') IS NOT NULL`,
      []
    ),

    // Unique users
    d1.query(`SELECT COUNT(DISTINCT user_id) as total FROM debates WHERE ${REAL_USERS_FILTER}`, []),

    // Debates today
    d1.query(
      `SELECT COUNT(*) as total FROM debates WHERE ${REAL_DEBATES_FILTER} AND created_at >= date('now')`,
      []
    ),

    // Debates this week
    d1.query(
      `SELECT COUNT(*) as total FROM debates WHERE ${REAL_DEBATES_FILTER} AND created_at >= date('now', '-7 days')`,
      []
    ),

    // Avg messages (heavy query)
    d1.query(
      `SELECT AVG(msg_len) as avg_msgs FROM (
        SELECT json_array_length(messages) as msg_len 
        FROM debates 
        WHERE ${REAL_DEBATES_FILTER} AND messages IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 1000
      )`,
      []
    ),

    // Top topics (heavy query)
    d1.query(
      `SELECT topic, COUNT(*) as count FROM (
        SELECT topic 
        FROM debates 
        WHERE ${REAL_DEBATES_FILTER} AND topic IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 5000
      ) GROUP BY topic ORDER BY count DESC LIMIT 10`,
      []
    ),
  ]);

  const totalResult = unwrap(results[0], emptyD1Result, 'totalDebates');
  const completedResult = unwrap(results[1], emptyD1Result, 'debatesCompleted');
  const usersResult = unwrap(results[2], emptyD1Result, 'uniqueUsers');
  const todayResult = unwrap(results[3], emptyD1Result, 'debatesToday');
  const weekResult = unwrap(results[4], emptyD1Result, 'debatesThisWeek');
  const avgMsgsResult = unwrap(results[5], emptyD1Result, 'avgMessages');
  const topTopicsResult = unwrap(results[6], emptyD1Result, 'topTopics');

  const totalDebates = (totalResult.result?.[0]?.total as number) || 0;
  const debatesCompleted = (completedResult.result?.[0]?.total as number) || 0;

  const stats: StatsResponse = {
    totalDebates,
    debatesCompleted,
    completionRate: totalDebates > 0 ? Math.round((debatesCompleted / totalDebates) * 1000) / 1000 : 0,
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
      ...rl.headers,
    },
  });
});
