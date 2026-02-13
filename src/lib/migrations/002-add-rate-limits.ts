export const MIGRATION_002_RATE_LIMITS = [
  `CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER DEFAULT 1,
    expires_at INTEGER NOT NULL
  )`
];

export const MIGRATION_002_SQL = MIGRATION_002_RATE_LIMITS.join(';\n') + ';';
