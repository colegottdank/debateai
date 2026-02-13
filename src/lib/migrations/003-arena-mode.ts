/**
 * Migration 003: Arena Mode (Gamification)
 * 
 * Introduces the `arena_matches` table to track gamified debate sessions.
 * This moves state out of the `score_data` blob in `debates` into a structured
 * table for better querying and real-time updates.
 */

export const MIGRATION_003_ARENA = [
  // Arena matches table linked to debates
  // id should match the debate_id
  `CREATE TABLE IF NOT EXISTS arena_matches (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_hp INTEGER NOT NULL DEFAULT 100,
    ai_hp INTEGER NOT NULL DEFAULT 100,
    max_hp INTEGER NOT NULL DEFAULT 100,
    combo_count INTEGER NOT NULL DEFAULT 0,
    status_effects TEXT DEFAULT '[]', -- JSON array of active effects
    turn_history TEXT DEFAULT '[]',   -- JSON log of turns
    winner TEXT,                      -- 'user', 'ai', or NULL
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Index for looking up active arena matches for a user
  `CREATE INDEX IF NOT EXISTS idx_arena_user 
   ON arena_matches(user_id)`,

  // Index for sorting by date (e.g. match history)
  `CREATE INDEX IF NOT EXISTS idx_arena_created 
   ON arena_matches(created_at DESC)`
];

export const MIGRATION_003_SQL = MIGRATION_003_ARENA.join(';\n') + ';';
