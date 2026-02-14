/**
 * Migration 004: Arena Rankings
 * 
 * Adds tables for tracking player performance, rankings, and detailed match history in Arena Mode.
 */

export const MIGRATION_004_RANKINGS = [
  // User stats for Arena mode (ELO, wins, etc)
  `CREATE TABLE IF NOT EXISTS arena_stats (
    user_id TEXT PRIMARY KEY,
    elo_rating INTEGER DEFAULT 1200,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    total_damage_dealt INTEGER DEFAULT 0,
    total_damage_taken INTEGER DEFAULT 0,
    average_turns_per_match REAL DEFAULT 0,
    last_played_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Detailed turn history for analytics
  `CREATE TABLE IF NOT EXISTS arena_rounds (
    id INTEGER PRIMARY KEY,
    match_id TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    user_action TEXT,
    user_damage INTEGER,
    ai_action TEXT,
    ai_damage INTEGER,
    user_hp_start INTEGER,
    user_hp_end INTEGER,
    ai_hp_start INTEGER,
    ai_hp_end INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Arena Seasons
  `CREATE TABLE IF NOT EXISTS arena_seasons (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    is_active BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  // Indices
  `CREATE INDEX IF NOT EXISTS idx_arena_stats_elo ON arena_stats(elo_rating DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_arena_rounds_match ON arena_rounds(match_id)`,
  `CREATE INDEX IF NOT EXISTS idx_arena_seasons_active ON arena_seasons(is_active)`
];

export const MIGRATION_004_SQL = MIGRATION_004_RANKINGS.join(';\n') + ';';
