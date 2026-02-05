import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helper';
import { d1 } from '@/lib/d1';

// Admin user IDs — only these users can access admin endpoints
const ADMIN_USER_IDS = new Set([
  process.env.ADMIN_USER_ID, // Primary admin (Cole) — set in env vars
]);

// Cache admin stats for 2 minutes
let statsCache: { data: AdminStats; timestamp: number } | null = null;
const CACHE_TTL = 2 * 60 * 1000;

interface AdminStats {
  // Core counts
  totalDebates: number;
  totalUsers: number;
  premiumUsers: number;
  freeUsers: number;
  conversionRate: number; // premium / total users as percentage

  // Activity
  debatesToday: number;
  debatesThisWeek: number;
  debatesThisMonth: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;

  // Engagement
  avgMessagesPerDebate: number;
  totalMessages: number;
  debatesWithMultipleRounds: number; // debates with > 2 user messages

  // Revenue signals
  premiumDebatesToday: number;
  freeDebatesToday: number;
  churningUsers: number; // premium users with cancel_at_period_end = true

  // Top content
  topTopics: Array<{ topic: string; count: number }>;
  topOpponents: Array<{ opponent: string; count: number }>;

  // Daily trend (last 7 days)
  dailyTrend: Array<{ date: string; debates: number; users: number }>;

  // Meta
  generatedAt: string;
  cached: boolean;
}

/**
 * GET /api/admin/stats
 *
 * Protected admin endpoint — returns comprehensive platform metrics.
 * Requires authenticated user with admin role.
 */
export async function GET() {
  try {
    const userId = await getUserId();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin access
    if (!ADMIN_USER_IDS.has(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Return cache if fresh
    if (statsCache && Date.now() - statsCache.timestamp < CACHE_TTL) {
      return NextResponse.json({ ...statsCache.data, cached: true });
    }

    // Run all queries in parallel
    const [
      totalDebatesResult,
      totalUsersResult,
      premiumUsersResult,
      debatesTodayResult,
      debatesWeekResult,
      debatesMonthResult,
      activeUsersTodayResult,
      activeUsersWeekResult,
      avgMsgsResult,
      totalMsgsResult,
      multiRoundResult,
      premiumDebatesTodayResult,
      freeDebatesTodayResult,
      churningResult,
      topTopicsResult,
      topOpponentsResult,
      dailyTrendResult,
    ] = await Promise.all([
      // Total debates
      d1.query('SELECT COUNT(*) as total FROM debates', []),

      // Total unique users (from debates table — includes all who debated)
      d1.query('SELECT COUNT(DISTINCT user_id) as total FROM debates', []),

      // Premium users (active subscription)
      d1.query(
        "SELECT COUNT(*) as total FROM users WHERE subscription_status = 'active' AND stripe_plan = 'premium'",
        []
      ),

      // Debates today
      d1.query(
        "SELECT COUNT(*) as total FROM debates WHERE created_at >= date('now')",
        []
      ),

      // Debates this week
      d1.query(
        "SELECT COUNT(*) as total FROM debates WHERE created_at >= date('now', '-7 days')",
        []
      ),

      // Debates this month
      d1.query(
        "SELECT COUNT(*) as total FROM debates WHERE created_at >= date('now', '-30 days')",
        []
      ),

      // Active users today (distinct users who created debates today)
      d1.query(
        "SELECT COUNT(DISTINCT user_id) as total FROM debates WHERE created_at >= date('now')",
        []
      ),

      // Active users this week
      d1.query(
        "SELECT COUNT(DISTINCT user_id) as total FROM debates WHERE created_at >= date('now', '-7 days')",
        []
      ),

      // Average messages per debate
      d1.query(
        "SELECT AVG(json_array_length(messages)) as avg_msgs FROM debates WHERE messages IS NOT NULL",
        []
      ),

      // Total messages across all debates
      d1.query(
        "SELECT SUM(json_array_length(messages)) as total FROM debates WHERE messages IS NOT NULL",
        []
      ),

      // Debates with > 4 messages (multiple rounds of actual debate)
      d1.query(
        "SELECT COUNT(*) as total FROM debates WHERE json_array_length(messages) > 4",
        []
      ),

      // Premium users' debates today
      d1.query(
        `SELECT COUNT(*) as total FROM debates d
         INNER JOIN users u ON d.user_id = u.user_id
         WHERE d.created_at >= date('now')
         AND u.subscription_status = 'active' AND u.stripe_plan = 'premium'`,
        []
      ),

      // Free users' debates today
      d1.query(
        `SELECT COUNT(*) as total FROM debates d
         LEFT JOIN users u ON d.user_id = u.user_id
         WHERE d.created_at >= date('now')
         AND (u.subscription_status IS NULL OR u.subscription_status != 'active' OR u.stripe_plan != 'premium')`,
        []
      ),

      // Churning users (premium with cancel pending)
      d1.query(
        "SELECT COUNT(*) as total FROM users WHERE subscription_status = 'active' AND cancel_at_period_end = 1",
        []
      ),

      // Top 10 topics
      d1.query(
        'SELECT topic, COUNT(*) as count FROM debates WHERE topic IS NOT NULL GROUP BY topic ORDER BY count DESC LIMIT 10',
        []
      ),

      // Top 10 opponents
      d1.query(
        "SELECT COALESCE(json_extract(score_data, '$.opponentStyle'), opponent) as opponent, COUNT(*) as count FROM debates GROUP BY opponent ORDER BY count DESC LIMIT 10",
        []
      ),

      // Daily trend (last 7 days)
      d1.query(
        `SELECT
           date(created_at) as date,
           COUNT(*) as debates,
           COUNT(DISTINCT user_id) as users
         FROM debates
         WHERE created_at >= date('now', '-7 days')
         GROUP BY date(created_at)
         ORDER BY date ASC`,
        []
      ),
    ]);

    const totalUsers = (totalUsersResult.result?.[0]?.total as number) || 0;
    const premiumUsers = (premiumUsersResult.result?.[0]?.total as number) || 0;
    const freeUsers = Math.max(0, totalUsers - premiumUsers);

    const stats: AdminStats = {
      totalDebates: (totalDebatesResult.result?.[0]?.total as number) || 0,
      totalUsers,
      premiumUsers,
      freeUsers,
      conversionRate: totalUsers > 0
        ? Math.round((premiumUsers / totalUsers) * 1000) / 10
        : 0,

      debatesToday: (debatesTodayResult.result?.[0]?.total as number) || 0,
      debatesThisWeek: (debatesWeekResult.result?.[0]?.total as number) || 0,
      debatesThisMonth: (debatesMonthResult.result?.[0]?.total as number) || 0,
      activeUsersToday: (activeUsersTodayResult.result?.[0]?.total as number) || 0,
      activeUsersThisWeek: (activeUsersWeekResult.result?.[0]?.total as number) || 0,

      avgMessagesPerDebate: Math.round(((avgMsgsResult.result?.[0]?.avg_msgs as number) || 0) * 10) / 10,
      totalMessages: (totalMsgsResult.result?.[0]?.total as number) || 0,
      debatesWithMultipleRounds: (multiRoundResult.result?.[0]?.total as number) || 0,

      premiumDebatesToday: (premiumDebatesTodayResult.result?.[0]?.total as number) || 0,
      freeDebatesToday: (freeDebatesTodayResult.result?.[0]?.total as number) || 0,
      churningUsers: (churningResult.result?.[0]?.total as number) || 0,

      topTopics: (topTopicsResult.result || []).map((r: Record<string, unknown>) => ({
        topic: (r.topic as string) || 'Unknown',
        count: (r.count as number) || 0,
      })),
      topOpponents: (topOpponentsResult.result || []).map((r: Record<string, unknown>) => ({
        opponent: (r.opponent as string) || 'Unknown',
        count: (r.count as number) || 0,
      })),
      dailyTrend: (dailyTrendResult.result || []).map((r: Record<string, unknown>) => ({
        date: (r.date as string) || '',
        debates: (r.debates as number) || 0,
        users: (r.users as number) || 0,
      })),

      generatedAt: new Date().toISOString(),
      cached: false,
    };

    // Update cache
    statsCache = { data: stats, timestamp: Date.now() };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
