/**
 * Daily Topics — D1 persistence layer.
 *
 * Tables:
 *   daily_topics         — curated topic pool
 *   daily_topic_history  — rotation log (one row per day)
 *
 * Rotation algorithm:
 *   1. Fetch all enabled topics
 *   2. Exclude any shown in the last 30 days
 *   3. Weighted random pick (higher weight → more likely)
 *   4. Insert into history, return selected topic
 */

import { d1 } from './d1';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DailyTopic {
  id: string;
  topic: string;
  persona: string;
  persona_id: string | null;
  category: string;
  weight: number;
  enabled: number; // 0 | 1 (SQLite boolean)
  created_at: string;
  updated_at: string;
}

export interface TopicHistoryEntry {
  id: string;
  topic_id: string;
  shown_date: string; // YYYY-MM-DD
  created_at: string;
  // Joined fields (optional)
  topic?: string;
  persona?: string;
  category?: string;
}

/* ------------------------------------------------------------------ */
/*  Schema / Migration                                                 */
/* ------------------------------------------------------------------ */

export async function createTopicTables() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS daily_topics (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      persona TEXT NOT NULL,
      persona_id TEXT,
      category TEXT NOT NULL DEFAULT 'general',
      weight REAL NOT NULL DEFAULT 1.0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS daily_topic_history (
      id TEXT PRIMARY KEY,
      topic_id TEXT NOT NULL,
      shown_date TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (topic_id) REFERENCES daily_topics(id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_daily_topics_enabled ON daily_topics(enabled)`,
    `CREATE INDEX IF NOT EXISTS idx_daily_topics_category ON daily_topics(category)`,
    `CREATE INDEX IF NOT EXISTS idx_daily_topic_history_date ON daily_topic_history(shown_date DESC)`,
  ];

  const results = [];
  for (const sql of queries) {
    results.push(await d1.query(sql));
  }
  return results;
}

/* ------------------------------------------------------------------ */
/*  Topic Pool CRUD                                                    */
/* ------------------------------------------------------------------ */

export async function listTopics(opts?: {
  enabledOnly?: boolean;
  category?: string;
  limit?: number;
  offset?: number;
}): Promise<DailyTopic[]> {
  const where: string[] = [];
  const params: unknown[] = [];

  if (opts?.enabledOnly) {
    where.push('enabled = 1');
  }
  if (opts?.category) {
    where.push('category = ?');
    params.push(opts.category);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const limit = opts?.limit ?? 200;
  const offset = opts?.offset ?? 0;

  const result = await d1.query(
    `SELECT * FROM daily_topics ${whereClause} ORDER BY category, topic LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  return (result.result ?? []) as unknown as DailyTopic[];
}

export async function getTopic(id: string): Promise<DailyTopic | null> {
  const result = await d1.query(
    'SELECT * FROM daily_topics WHERE id = ? LIMIT 1',
    [id],
  );
  const rows = result.result ?? [];
  return rows.length > 0 ? (rows[0] as unknown as DailyTopic) : null;
}

export async function addTopic(topic: {
  id?: string;
  topic: string;
  persona: string;
  persona_id?: string;
  category: string;
  weight?: number;
}): Promise<{ success: boolean; id: string }> {
  const id = topic.id ?? crypto.randomUUID();
  const result = await d1.query(
    `INSERT INTO daily_topics (id, topic, persona, persona_id, category, weight)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, topic.topic, topic.persona, topic.persona_id ?? null, topic.category, topic.weight ?? 1.0],
  );
  return { success: result.success, id };
}

export async function updateTopic(
  id: string,
  patch: Partial<Pick<DailyTopic, 'topic' | 'persona' | 'persona_id' | 'category' | 'weight' | 'enabled'>>,
): Promise<boolean> {
  const sets: string[] = [];
  const params: unknown[] = [];

  for (const [key, val] of Object.entries(patch)) {
    if (val !== undefined) {
      sets.push(`${key} = ?`);
      params.push(val);
    }
  }

  if (sets.length === 0) return true;

  sets.push("updated_at = datetime('now')");
  params.push(id);

  const result = await d1.query(
    `UPDATE daily_topics SET ${sets.join(', ')} WHERE id = ?`,
    params,
  );
  return result.success;
}

export async function deleteTopic(id: string): Promise<boolean> {
  const result = await d1.query('DELETE FROM daily_topics WHERE id = ?', [id]);
  return result.success;
}

export async function getTopicCount(): Promise<number> {
  const result = await d1.query('SELECT COUNT(*) as count FROM daily_topics WHERE enabled = 1');
  if (result.success && result.result && result.result.length > 0) {
    return (result.result[0] as Record<string, unknown>).count as number;
  }
  return 0;
}

/* ------------------------------------------------------------------ */
/*  Rotation Logic                                                     */
/* ------------------------------------------------------------------ */

/**
 * Get topic IDs shown in the last N days.
 */
async function getRecentlyShownIds(days: number): Promise<Set<string>> {
  const result = await d1.query(
    `SELECT topic_id FROM daily_topic_history
     WHERE shown_date >= date('now', '-' || ? || ' days')
     ORDER BY shown_date DESC`,
    [days],
  );

  const ids = new Set<string>();
  for (const row of (result.result ?? []) as Array<Record<string, unknown>>) {
    ids.add(row.topic_id as string);
  }
  return ids;
}

/**
 * Weighted random selection from a list of topics.
 * Higher weight → more likely to be picked.
 */
function weightedRandomPick(topics: DailyTopic[]): DailyTopic {
  const totalWeight = topics.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const topic of topics) {
    roll -= topic.weight;
    if (roll <= 0) return topic;
  }

  // Fallback (shouldn't reach here, but just in case)
  return topics[topics.length - 1];
}

/**
 * Select the next daily topic using weighted random selection.
 * Never repeats within `cooldownDays` (default 30).
 */
export async function rotateDailyTopic(
  cooldownDays = 30,
): Promise<{ success: boolean; topic: DailyTopic | null; date: string }> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD UTC

  // Check if we already rotated today
  const existing = await d1.query(
    `SELECT h.*, t.topic, t.persona, t.category
     FROM daily_topic_history h
     JOIN daily_topics t ON t.id = h.topic_id
     WHERE h.shown_date = ?
     LIMIT 1`,
    [today],
  );

  if (existing.success && existing.result && existing.result.length > 0) {
    const row = existing.result[0] as unknown as TopicHistoryEntry & DailyTopic;
    const topic = await getTopic(row.topic_id);
    return { success: true, topic, date: today };
  }

  // Get all enabled topics
  const allTopics = await listTopics({ enabledOnly: true });

  if (allTopics.length === 0) {
    return { success: false, topic: null, date: today };
  }

  // Exclude recently shown
  const recentIds = await getRecentlyShownIds(cooldownDays);
  let candidates = allTopics.filter((t) => !recentIds.has(t.id));

  // If all topics have been shown recently, relax the cooldown
  if (candidates.length === 0) {
    // Use a shorter cooldown — pick from anything not shown in last 7 days
    const shortRecentIds = await getRecentlyShownIds(7);
    candidates = allTopics.filter((t) => !shortRecentIds.has(t.id));

    // Still empty? Pick from anything (reset)
    if (candidates.length === 0) {
      candidates = allTopics;
    }
  }

  // Weighted random selection
  const selected = weightedRandomPick(candidates);

  // Record in history
  const historyId = crypto.randomUUID();
  await d1.query(
    `INSERT INTO daily_topic_history (id, topic_id, shown_date)
     VALUES (?, ?, ?)`,
    [historyId, selected.id, today],
  );

  return { success: true, topic: selected, date: today };
}

/**
 * Get today's daily topic. If none exists yet, triggers rotation.
 */
export async function getCurrentDailyTopic(): Promise<DailyTopic | null> {
  const today = new Date().toISOString().split('T')[0];

  // Try to get today's topic from history
  const result = await d1.query(
    `SELECT t.*
     FROM daily_topic_history h
     JOIN daily_topics t ON t.id = h.topic_id
     WHERE h.shown_date = ?
     LIMIT 1`,
    [today],
  );

  if (result.success && result.result && result.result.length > 0) {
    return result.result[0] as unknown as DailyTopic;
  }

  // No topic for today — trigger rotation
  const rotation = await rotateDailyTopic();
  return rotation.topic;
}

/* ------------------------------------------------------------------ */
/*  Topic History                                                      */
/* ------------------------------------------------------------------ */

export async function getTopicHistory(limit = 30): Promise<TopicHistoryEntry[]> {
  const result = await d1.query(
    `SELECT h.id, h.topic_id, h.shown_date, h.created_at,
            t.topic, t.persona, t.category
     FROM daily_topic_history h
     JOIN daily_topics t ON t.id = h.topic_id
     ORDER BY h.shown_date DESC
     LIMIT ?`,
    [limit],
  );

  return (result.result ?? []) as unknown as TopicHistoryEntry[];
}
