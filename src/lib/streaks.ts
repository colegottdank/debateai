/**
 * Streak + Points + Leaderboard system.
 *
 * All state lives in D1. Streaks and points are updated when a debate is scored.
 * Leaderboard queries aggregate from user_stats + user_streaks.
 */

import { d1 } from './d1';

// ── Points System ────────────────────────────────────────────────

export const POINTS = {
  DEBATE_COMPLETE: 10,
  WIN: 5,
  STREAK_BONUS: 2, // per day of current streak
  SHARE: 3,
} as const;

// ── Table Creation ───────────────────────────────────────────────

export async function createStreakTables() {
  await d1.query(`
    CREATE TABLE IF NOT EXISTS user_streaks (
      user_id TEXT PRIMARY KEY,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_debate_date TEXT,
      total_points INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await d1.query(`
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY,
      display_name TEXT,
      total_debates INTEGER DEFAULT 0,
      total_wins INTEGER DEFAULT 0,
      total_draws INTEGER DEFAULT 0,
      total_losses INTEGER DEFAULT 0,
      total_score REAL DEFAULT 0,
      week_debates INTEGER DEFAULT 0,
      week_wins INTEGER DEFAULT 0,
      week_score REAL DEFAULT 0,
      week_start TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Indexes for leaderboard queries
  await d1.query(`CREATE INDEX IF NOT EXISTS idx_user_stats_points ON user_streaks(total_points DESC)`);
  await d1.query(`CREATE INDEX IF NOT EXISTS idx_user_stats_streak ON user_streaks(current_streak DESC)`);
  await d1.query(`CREATE INDEX IF NOT EXISTS idx_user_stats_debates ON user_stats(total_debates DESC)`);
  await d1.query(`CREATE INDEX IF NOT EXISTS idx_user_stats_week ON user_stats(week_debates DESC)`);
}

// ── Streak Logic ─────────────────────────────────────────────────

/** Get today's date string in YYYY-MM-DD (UTC). */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Get yesterday's date string in YYYY-MM-DD (UTC). */
function yesterdayUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Get the start of the current ISO week (Monday) as YYYY-MM-DD. */
function currentWeekStart(): string {
  const d = new Date();
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setUTCDate(diff);
  return d.toISOString().slice(0, 10);
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastDebateDate: string | null;
  totalPoints: number;
  debatedToday: boolean;
}

/** Get a user's current streak data. */
export async function getStreak(userId: string): Promise<StreakData> {
  const result = await d1.query(
    `SELECT current_streak, longest_streak, last_debate_date, total_points
     FROM user_streaks WHERE user_id = ?`,
    [userId],
  );

  if (!result.success || !result.result || result.result.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastDebateDate: null, totalPoints: 0, debatedToday: false };
  }

  const row = result.result[0] as Record<string, unknown>;
  const lastDate = row.last_debate_date as string | null;
  const today = todayUTC();
  const yesterday = yesterdayUTC();

  // Check if streak is still alive
  let currentStreak = (row.current_streak as number) || 0;
  if (lastDate && lastDate !== today && lastDate !== yesterday) {
    // Streak broken — hasn't debated today or yesterday
    currentStreak = 0;
  }

  return {
    currentStreak,
    longestStreak: (row.longest_streak as number) || 0,
    lastDebateDate: lastDate,
    totalPoints: (row.total_points as number) || 0,
    debatedToday: lastDate === today,
  };
}

/**
 * Update streak + stats + points after a debate is scored.
 * Called from the score API route.
 */
export async function recordDebateCompletion(
  userId: string,
  result: 'win' | 'loss' | 'draw',
  userScore: number,
  displayName?: string,
) {
  const today = todayUTC();
  const weekStart = currentWeekStart();

  // ── 1. Update streak ──────────────────────────────────────

  const streakRow = await d1.query(
    `SELECT current_streak, longest_streak, last_debate_date, total_points
     FROM user_streaks WHERE user_id = ?`,
    [userId],
  );

  let currentStreak: number;
  let longestStreak: number;
  let totalPoints: number;
  let alreadyDebatedToday: boolean;

  if (!streakRow.success || !streakRow.result || streakRow.result.length === 0) {
    // First ever debate
    currentStreak = 1;
    longestStreak = 1;
    totalPoints = 0;
    alreadyDebatedToday = false;

    await d1.query(
      `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_debate_date, total_points, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, currentStreak, longestStreak, today, 0],
    );
  } else {
    const row = streakRow.result[0] as Record<string, unknown>;
    const lastDate = row.last_debate_date as string | null;
    longestStreak = (row.longest_streak as number) || 0;
    totalPoints = (row.total_points as number) || 0;
    alreadyDebatedToday = lastDate === today;

    if (lastDate === today) {
      // Already debated today — streak unchanged
      currentStreak = (row.current_streak as number) || 1;
    } else if (lastDate === yesterdayUTC()) {
      // Consecutive day — extend streak
      currentStreak = ((row.current_streak as number) || 0) + 1;
    } else {
      // Streak broken — start fresh
      currentStreak = 1;
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
  }

  // ── 2. Calculate points ────────────────────────────────────

  let pointsEarned = POINTS.DEBATE_COMPLETE;
  if (result === 'win') pointsEarned += POINTS.WIN;
  if (!alreadyDebatedToday && currentStreak > 1) {
    pointsEarned += POINTS.STREAK_BONUS * currentStreak;
  }

  totalPoints += pointsEarned;

  // Update streak row
  await d1.query(
    `UPDATE user_streaks
     SET current_streak = ?, longest_streak = ?, last_debate_date = ?, total_points = ?, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [currentStreak, longestStreak, today, totalPoints, userId],
  );

  // ── 3. Update stats ───────────────────────────────────────

  const statsRow = await d1.query(
    `SELECT total_debates, total_wins, total_draws, total_losses, total_score,
            week_debates, week_wins, week_score, week_start
     FROM user_stats WHERE user_id = ?`,
    [userId],
  );

  if (!statsRow.success || !statsRow.result || statsRow.result.length === 0) {
    // First entry
    await d1.query(
      `INSERT INTO user_stats (user_id, display_name, total_debates, total_wins, total_draws, total_losses, total_score,
                               week_debates, week_wins, week_score, week_start, updated_at)
       VALUES (?, ?, 1, ?, ?, ?, ?, 1, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        userId,
        displayName || null,
        result === 'win' ? 1 : 0,
        result === 'draw' ? 1 : 0,
        result === 'loss' ? 1 : 0,
        userScore,
        result === 'win' ? 1 : 0,
        userScore,
        weekStart,
      ],
    );
  } else {
    const s = statsRow.result[0] as Record<string, unknown>;
    const storedWeekStart = s.week_start as string | null;

    // Reset weekly counters if we're in a new week
    const isNewWeek = storedWeekStart !== weekStart;
    const weekDebates = isNewWeek ? 1 : ((s.week_debates as number) || 0) + 1;
    const weekWins = isNewWeek
      ? (result === 'win' ? 1 : 0)
      : ((s.week_wins as number) || 0) + (result === 'win' ? 1 : 0);
    const weekScore = isNewWeek ? userScore : ((s.week_score as number) || 0) + userScore;

    await d1.query(
      `UPDATE user_stats SET
         display_name = COALESCE(?, display_name),
         total_debates = total_debates + 1,
         total_wins = total_wins + ?,
         total_draws = total_draws + ?,
         total_losses = total_losses + ?,
         total_score = total_score + ?,
         week_debates = ?,
         week_wins = ?,
         week_score = ?,
         week_start = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [
        displayName || null,
        result === 'win' ? 1 : 0,
        result === 'draw' ? 1 : 0,
        result === 'loss' ? 1 : 0,
        userScore,
        weekDebates,
        weekWins,
        weekScore,
        weekStart,
        userId,
      ],
    );
  }

  return { pointsEarned, currentStreak, longestStreak, totalPoints };
}

/**
 * Award share points. Called from share tracking endpoint.
 */
export async function awardSharePoints(userId: string) {
  await d1.query(
    `UPDATE user_streaks SET total_points = total_points + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
    [POINTS.SHARE, userId],
  );
}

// ── Leaderboard Queries ──────────────────────────────────────────

export type LeaderboardSort = 'points' | 'streak' | 'debates' | 'avg_score';
export type LeaderboardPeriod = 'weekly' | 'alltime';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string | null;
  username: string | null;
  totalDebates: number;
  totalWins: number;
  currentStreak: number;
  longestStreak: number;
  avgScore: number;
  totalPoints: number;
}

export async function getLeaderboard(
  period: LeaderboardPeriod = 'alltime',
  sort: LeaderboardSort = 'points',
  limit = 25,
): Promise<LeaderboardEntry[]> {
  // Build ORDER BY based on sort
  let orderBy: string;
  switch (sort) {
    case 'points':
      orderBy = 'sk.total_points DESC';
      break;
    case 'streak':
      orderBy = 'sk.current_streak DESC, sk.longest_streak DESC';
      break;
    case 'debates':
      orderBy = period === 'weekly' ? 'st.week_debates DESC' : 'st.total_debates DESC';
      break;
    case 'avg_score':
      orderBy = period === 'weekly'
        ? 'CASE WHEN st.week_debates > 0 THEN st.week_score / st.week_debates ELSE 0 END DESC'
        : 'CASE WHEN st.total_debates > 0 THEN st.total_score / st.total_debates ELSE 0 END DESC';
      break;
    default:
      orderBy = 'sk.total_points DESC';
  }

  // Min debates filter (avoid users with 1 fluke win ranking high on avg)
  const minDebates = sort === 'avg_score' ? 3 : 1;
  const debatesCol = period === 'weekly' ? 'st.week_debates' : 'st.total_debates';

  const result = await d1.query(
    `SELECT
       st.user_id,
       st.display_name,
       st.total_debates,
       st.total_wins,
       st.week_debates,
       st.week_wins,
       st.week_score,
       st.total_score,
       sk.current_streak,
       sk.longest_streak,
       sk.total_points,
       sk.last_debate_date,
       up.username
     FROM user_stats st
     JOIN user_streaks sk ON st.user_id = sk.user_id
     LEFT JOIN user_profiles up ON st.user_id = up.user_id
     WHERE ${debatesCol} >= ?
     ORDER BY ${orderBy}
     LIMIT ?`,
    [minDebates, limit],
  );

  if (!result.success || !result.result) return [];

  const today = todayUTC();
  const yesterday = yesterdayUTC();

  return result.result.map((row, idx) => {
    const r = row as Record<string, unknown>;
    const lastDate = r.last_debate_date as string | null;
    const totalDebates = period === 'weekly'
      ? (r.week_debates as number) || 0
      : (r.total_debates as number) || 0;
    const totalWins = period === 'weekly'
      ? (r.week_wins as number) || 0
      : (r.total_wins as number) || 0;
    const totalScore = period === 'weekly'
      ? (r.week_score as number) || 0
      : (r.total_score as number) || 0;

    // Check if streak is still active
    let currentStreak = (r.current_streak as number) || 0;
    if (lastDate && lastDate !== today && lastDate !== yesterday) {
      currentStreak = 0;
    }

    return {
      rank: idx + 1,
      userId: r.user_id as string,
      displayName: r.display_name as string | null,
      username: (r.username as string) || null,
      totalDebates,
      totalWins,
      currentStreak,
      longestStreak: (r.longest_streak as number) || 0,
      avgScore: totalDebates > 0 ? Math.round((totalScore / totalDebates) * 10) / 10 : 0,
      totalPoints: (r.total_points as number) || 0,
    };
  });
}
