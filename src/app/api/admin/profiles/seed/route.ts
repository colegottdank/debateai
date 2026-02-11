import { NextResponse } from 'next/server';
import { withErrorHandler, errors } from '@/lib/api-errors';
import { getUserId } from '@/lib/auth-helper';
import { createProfileTables } from '@/lib/profiles';

/**
 * POST /api/admin/profiles/seed
 *
 * Creates the user_profiles table + indexes.
 */
export const POST = withErrorHandler(async () => {
  const userId = await getUserId();
  if (!userId) throw errors.unauthorized();

  await createProfileTables();

  return NextResponse.json({ success: true, message: 'Profile tables created' });
});
