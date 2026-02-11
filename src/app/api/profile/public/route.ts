import { NextResponse } from 'next/server';
import { withErrorHandler, errors } from '@/lib/api-errors';
import { getPublicProfile } from '@/lib/profiles';

/**
 * GET /api/profile/public?username=...
 *
 * Public profile data — no auth required.
 * Returns stats, streak, recent debates for a public user.
 */
export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    throw errors.badRequest('username parameter required');
  }

  const profile = await getPublicProfile(username);

  if (!profile) {
    throw errors.notFound('Profile not found or is private');
  }

  return NextResponse.json(profile, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
});
