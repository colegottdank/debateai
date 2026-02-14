import { NextResponse } from 'next/server';
import { withErrorHandler, errors } from '@/lib/api-errors';
import { getUserId } from '@/lib/auth-helper';
import { d1 } from '@/lib/d1';

/**
 * POST /api/admin/profiles/seed
 *
 * Creates the user_profiles table + indexes.
 */
export const POST = withErrorHandler(async () => {
  const userId = await getUserId();
  if (!userId) throw errors.unauthorized();

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

  return NextResponse.json({ success: true, message: 'Profile tables created' });
});


