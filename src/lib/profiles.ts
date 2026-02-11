/**
 * User profiles — D1 persistence + queries.
 *
 * Profile data lives in user_profiles table. Stats pulled from
 * user_stats + user_streaks (created by streaks.ts).
 * Debates pulled from debates table.
 */

import { d1 } from './d1';

export interface UserProfile {
  userId: string;
  username: string;       // URL-safe slug
  displayName: string;
  bio: string | null;
  isPublic: boolean;
  createdAt: string;
}

export interface PublicProfileData {
  username: string;
  displayName: string;
  bio: string | null;
  totalDebates: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  avgScore: number;
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  memberSince: string;
  recentDebates: Array<{
    id: string;
    topic: string;
    opponent: string | null;
    userScore: number;
    aiScore: number;
    winner: string | null;
    createdAt: string;
  }>;
}

// ── Schema ───────────────────────────────────────────────────────

export async function createProfileTables() {
  await d1.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      bio TEXT,
      is_public INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await d1.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON user_profiles(username)`,
  );
}

// ── Queries ──────────────────────────────────────────────────────

/** Get a profile by username (public lookup). */
export async function getProfileByUsername(username: string): Promise<UserProfile | null> {
  const result = await d1.query(
    `SELECT user_id, username, display_name, bio, is_public, created_at
     FROM user_profiles WHERE username = ? LIMIT 1`,
    [username],
  );

  if (!result.success || !result.result || result.result.length === 0) return null;

  const r = result.result[0] as Record<string, unknown>;
  return {
    userId: r.user_id as string,
    username: r.username as string,
    displayName: r.display_name as string,
    bio: (r.bio as string) || null,
    isPublic: (r.is_public as number) === 1,
    createdAt: r.created_at as string,
  };
}

/** Get a profile by user_id (for settings). */
export async function getProfileByUserId(userId: string): Promise<UserProfile | null> {
  const result = await d1.query(
    `SELECT user_id, username, display_name, bio, is_public, created_at
     FROM user_profiles WHERE user_id = ? LIMIT 1`,
    [userId],
  );

  if (!result.success || !result.result || result.result.length === 0) return null;

  const r = result.result[0] as Record<string, unknown>;
  return {
    userId: r.user_id as string,
    username: r.username as string,
    displayName: r.display_name as string,
    bio: (r.bio as string) || null,
    isPublic: (r.is_public as number) === 1,
    createdAt: r.created_at as string,
  };
}

/** Get full public profile data (profile + stats + streaks + recent debates). */
export async function getPublicProfile(username: string): Promise<PublicProfileData | null> {
  const profile = await getProfileByUsername(username);
  if (!profile || !profile.isPublic) return null;

  // Get stats
  const statsResult = await d1.query(
    `SELECT total_debates, total_wins, total_draws, total_losses, total_score
     FROM user_stats WHERE user_id = ?`,
    [profile.userId],
  );
  const stats = (statsResult.result?.[0] as Record<string, unknown>) || {};
  const totalDebates = (stats.total_debates as number) || 0;
  const totalScore = (stats.total_score as number) || 0;

  // Get streaks
  const streakResult = await d1.query(
    `SELECT current_streak, longest_streak, total_points
     FROM user_streaks WHERE user_id = ?`,
    [profile.userId],
  );
  const streaks = (streakResult.result?.[0] as Record<string, unknown>) || {};

  // Get recent scored debates (public only)
  const debatesResult = await d1.query(
    `SELECT id, topic, opponent, user_score, ai_score, score_data, created_at
     FROM debates
     WHERE user_id = ? AND score_data IS NOT NULL AND json_extract(score_data, '$.debateScore') IS NOT NULL
     ORDER BY created_at DESC LIMIT 10`,
    [profile.userId],
  );

  const recentDebates = (debatesResult.result || []).map((row) => {
    const r = row as Record<string, unknown>;
    let winner: string | null = null;
    let opponentStyle: string | null = null;
    try {
      const sd = typeof r.score_data === 'string' ? JSON.parse(r.score_data) : r.score_data;
      winner = sd?.debateScore?.winner || null;
      opponentStyle = sd?.opponentStyle || null;
    } catch { /* ignore */ }

    return {
      id: r.id as string,
      topic: r.topic as string,
      opponent: opponentStyle || (r.opponent as string) || null,
      userScore: (r.user_score as number) || 0,
      aiScore: (r.ai_score as number) || 0,
      winner,
      createdAt: r.created_at as string,
    };
  });

  return {
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio,
    totalDebates,
    totalWins: (stats.total_wins as number) || 0,
    totalLosses: (stats.total_losses as number) || 0,
    totalDraws: (stats.total_draws as number) || 0,
    avgScore: totalDebates > 0 ? Math.round((totalScore / totalDebates) * 10) / 10 : 0,
    currentStreak: (streaks.current_streak as number) || 0,
    longestStreak: (streaks.longest_streak as number) || 0,
    totalPoints: (streaks.total_points as number) || 0,
    memberSince: profile.createdAt,
    recentDebates,
  };
}

// ── Mutations ────────────────────────────────────────────────────

/** Create or update a profile. */
export async function upsertProfile(
  userId: string,
  data: { username: string; displayName: string; bio?: string; isPublic?: boolean },
): Promise<{ success: boolean; error?: string }> {
  // Validate username format
  if (!/^[a-z0-9_-]{3,30}$/.test(data.username)) {
    return { success: false, error: 'Username must be 3-30 characters, lowercase alphanumeric, hyphens, underscores' };
  }

  // Check uniqueness (excluding self)
  const existing = await d1.query(
    `SELECT user_id FROM user_profiles WHERE username = ? AND user_id != ?`,
    [data.username, userId],
  );
  if (existing.result && existing.result.length > 0) {
    return { success: false, error: 'Username already taken' };
  }

  const result = await d1.query(
    `INSERT INTO user_profiles (user_id, username, display_name, bio, is_public, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       username = ?, display_name = ?, bio = ?, is_public = ?, updated_at = datetime('now')`,
    [
      userId,
      data.username,
      data.displayName,
      data.bio || null,
      data.isPublic !== false ? 1 : 0,
      data.username,
      data.displayName,
      data.bio || null,
      data.isPublic !== false ? 1 : 0,
    ],
  );

  return { success: result.success };
}

/** Generate a username slug from display name or email. */
export function generateUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 25)
    + '-' + Math.random().toString(36).slice(2, 6);
}
