export const MIGRATION_006_SQL = `
  CREATE TABLE IF NOT EXISTS content_reviews (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT,
    content TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, fast_tracked
    author TEXT,
    metadata TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_content_reviews_status ON content_reviews(status);
  CREATE INDEX IF NOT EXISTS idx_content_reviews_created ON content_reviews(created_at DESC);
`;
