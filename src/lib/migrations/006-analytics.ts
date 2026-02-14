/**
 * Migration 006: Analytics Events
 * 
 * Introduces the `analytics_events` table for granular event tracking.
 * Logs key debate lifecycle events: start, message, end, feedback.
 */

export const MIGRATION_006_ANALYTICS = [
  `CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_name TEXT NOT NULL,
    debate_id TEXT,
    user_id TEXT,
    turn_count INTEGER,
    payload TEXT, -- JSON payload for extra details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE INDEX IF NOT EXISTS idx_analytics_event 
   ON analytics_events(event_name)`,

  `CREATE INDEX IF NOT EXISTS idx_analytics_debate 
   ON analytics_events(debate_id)`,

  `CREATE INDEX IF NOT EXISTS idx_analytics_created 
   ON analytics_events(created_at DESC)`
];

export const MIGRATION_006_SQL = MIGRATION_006_ANALYTICS.join(';\n') + ';';
