import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helper';
import { d1 } from '@/lib/d1';
import { MIGRATION_001_INDEXES } from '@/lib/migrations/001-add-indexes';
import { MIGRATION_002_RATE_LIMITS } from '@/lib/migrations/002-add-rate-limits';

// Hardcoded admin user IDs (Cole's Clerk ID)
const ADMIN_USER_IDS = [
  process.env.ADMIN_USER_ID,
].filter(Boolean);

const ALL_MIGRATIONS = [
  ...MIGRATION_001_INDEXES,
  ...MIGRATION_002_RATE_LIMITS,
];

/**
 * POST /api/admin/migrate
 *
 * Runs database migrations. Admin-only.
 * Each migration is idempotent (CREATE ... IF NOT EXISTS).
 */
export async function POST() {
  const userId = await getUserId();

  if (!userId || !ADMIN_USER_IDS.includes(userId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const results: Array<{ sql: string; success: boolean; error?: string }> = [];

  for (const sql of ALL_MIGRATIONS) {
    try {
      const result = await d1.query(sql.trim(), []);
      results.push({
        sql: sql.trim().split('\n')[0] + '...',
        success: result.success !== false,
        ...(result.error && { error: String(result.error) }),
      });
    } catch (err) {
      results.push({
        sql: sql.trim().split('\n')[0] + '...',
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const allSuccess = results.every((r) => r.success);

  return NextResponse.json({
    migration: 'all',
    status: allSuccess ? 'complete' : 'partial',
    results,
  }, {
    status: allSuccess ? 200 : 207,
  });
}
