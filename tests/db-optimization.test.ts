/**
 * Tests for DB optimization: indexes and query improvements.
 */
import { describe, it, expect } from 'vitest';
import { MIGRATION_001_INDEXES } from '@/lib/migrations/001-add-indexes';

describe('Migration 001: Indexes', () => {
  it('defines expected number of indexes', () => {
    expect(MIGRATION_001_INDEXES.length).toBe(6);
  });

  it('all statements use CREATE INDEX IF NOT EXISTS', () => {
    for (const sql of MIGRATION_001_INDEXES) {
      expect(sql.trim()).toMatch(/^CREATE INDEX IF NOT EXISTS/);
    }
  });

  it('includes compound index for user + created_at', () => {
    const match = MIGRATION_001_INDEXES.find(s => s.includes('idx_debates_user_created'));
    expect(match).toBeDefined();
    expect(match).toContain('user_id, created_at DESC');
  });

  it('includes compound index for dedup check', () => {
    const match = MIGRATION_001_INDEXES.find(s => s.includes('idx_debates_user_topic_created'));
    expect(match).toBeDefined();
    expect(match).toContain('user_id, topic, created_at');
  });

  it('includes compound index for time-range stats', () => {
    const match = MIGRATION_001_INDEXES.find(s => s.includes('idx_debates_created_user'));
    expect(match).toBeDefined();
    expect(match).toContain('created_at, user_id');
  });

  it('includes subscription status index', () => {
    const match = MIGRATION_001_INDEXES.find(s => s.includes('idx_users_subscription'));
    expect(match).toBeDefined();
    expect(match).toContain('subscription_status, stripe_plan');
  });

  it('includes Stripe customer index', () => {
    const match = MIGRATION_001_INDEXES.find(s => s.includes('idx_users_stripe_customer'));
    expect(match).toBeDefined();
    expect(match).toContain('stripe_customer_id');
  });

  it('includes partial index for scored debates', () => {
    const match = MIGRATION_001_INDEXES.find(s => s.includes('idx_debates_score_data'));
    expect(match).toBeDefined();
    expect(match).toContain('WHERE score_data IS NOT NULL');
  });

  it('all statements are idempotent (safe to re-run)', () => {
    for (const sql of MIGRATION_001_INDEXES) {
      expect(sql).toContain('IF NOT EXISTS');
    }
  });
});

describe('Query optimizations', () => {
  it('findRecentDuplicate only selects id (not messages)', async () => {
    // Read the source to verify the query
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const src = readFileSync(join(process.cwd(), 'src/lib/d1.ts'), 'utf-8');
    
    // Find the findRecentDuplicate method
    const methodStart = src.indexOf('findRecentDuplicate');
    const methodBlock = src.substring(methodStart, methodStart + 500);
    
    expect(methodBlock).toContain('SELECT id FROM debates');
    expect(methodBlock).not.toContain('SELECT id, messages FROM debates');
  });

  it('getRecentDebates selects specific fields (not SELECT *)', async () => {
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const src = readFileSync(join(process.cwd(), 'src/lib/d1.ts'), 'utf-8');
    
    const methodStart = src.indexOf('getRecentDebates');
    // Only look at the query within the method (up to the closing brace)
    const methodEnd = src.indexOf('}', methodStart + 100);
    const methodBlock = src.substring(methodStart, methodEnd);
    
    expect(methodBlock).not.toContain('SELECT *');
    expect(methodBlock).toContain('json_array_length(messages)');
  });

  it('checkDebateMessageLimit uses json_array_length for fast path', async () => {
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const src = readFileSync(join(process.cwd(), 'src/lib/d1.ts'), 'utf-8');
    
    const methodStart = src.indexOf('checkDebateMessageLimit');
    const methodBlock = src.substring(methodStart, methodStart + 1500);
    
    // Should use json_array_length in first query for fast path
    expect(methodBlock).toContain('json_array_length(messages) as msg_count');
    // Should NOT use SELECT * or fetch full debate as first step
    expect(methodBlock).not.toContain('getDebate(debateId)');
  });
});
