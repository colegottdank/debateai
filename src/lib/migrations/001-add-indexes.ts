/**
 * Migration 001: Add missing indexes for launch readiness.
 *
 * Analysis of query patterns showed these gaps:
 *
 * 1. debates(user_id, created_at DESC)
 *    — Used by: getRecentDebates, /api/debates, findRecentDuplicate
 *    — Current: Single-column idx_debates_user forces a sort after filter
 *    — Fix: Compound index covers both filter and sort in one scan
 *
 * 2. debates(user_id, topic, created_at)
 *    — Used by: findRecentDuplicate (dedup check on every debate creation)
 *    — Current: Falls back to idx_debates_user + scan for topic match
 *    — Fix: Compound index makes dedup check O(1)
 *
 * 3. debates(created_at, user_id)
 *    — Used by: All stats/metrics endpoints (WHERE created_at >= date(...))
 *    — Current: idx_debates_created covers created_at but stats queries
 *      also filter on user_id != 'test-user-123'
 *    — Fix: Compound index lets SQLite use both columns from the index
 *
 * 4. users(subscription_status, stripe_plan)
 *    — Used by: admin/stats, checkDebateMessageLimit (premium check)
 *    — Current: Full table scan
 *    — Fix: Compound index for subscription status lookups
 *
 * 5. users(stripe_customer_id)
 *    — Used by: Stripe webhook to find user by customer ID
 *    — Current: No index (would scan all users)
 *    — Fix: Single-column index
 *
 * Run via: POST /api/admin/migrate (requires admin auth)
 * Or manually via D1 dashboard.
 */

export const MIGRATION_001_INDEXES = [
  // Compound index for user's debates sorted by date (covers getRecentDebates, /api/debates)
  `CREATE INDEX IF NOT EXISTS idx_debates_user_created 
   ON debates(user_id, created_at DESC)`,

  // Compound index for deduplication check (findRecentDuplicate)
  `CREATE INDEX IF NOT EXISTS idx_debates_user_topic_created 
   ON debates(user_id, topic, created_at DESC)`,

  // Compound index for time-range stats queries that filter test users
  `CREATE INDEX IF NOT EXISTS idx_debates_created_user 
   ON debates(created_at, user_id)`,

  // Index for subscription status lookups (premium checks, admin stats)
  `CREATE INDEX IF NOT EXISTS idx_users_subscription 
   ON users(subscription_status, stripe_plan)`,

  // Index for Stripe customer lookups (webhook flow)
  `CREATE INDEX IF NOT EXISTS idx_users_stripe_customer 
   ON users(stripe_customer_id)`,

  // Index for score_data existence checks (completed debates count)
  `CREATE INDEX IF NOT EXISTS idx_debates_score_data 
   ON debates(score_data) WHERE score_data IS NOT NULL AND score_data != 'null'`,
];

export const MIGRATION_001_SQL = MIGRATION_001_INDEXES.join(';\n') + ';';
