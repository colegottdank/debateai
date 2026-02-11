import { NextResponse } from 'next/server';
import { withErrorHandler, errors } from '@/lib/api-errors';
import { getUserId } from '@/lib/auth-helper';
import { createStreakTables } from '@/lib/streaks';

/**
 * POST /api/admin/streaks/seed
 *
 * Creates the user_streaks and user_stats tables + indexes.
 * Admin-only — requires authenticated user.
 */
export const POST = withErrorHandler(async () => {
  const userId = await getUserId();
  if (!userId) throw errors.unauthorized();

  await createStreakTables();

  return NextResponse.json({ success: true, message: 'Streak tables created' });
});
