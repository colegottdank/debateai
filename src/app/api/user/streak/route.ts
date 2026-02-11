import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helper';
import { withErrorHandler, errors } from '@/lib/api-errors';
import { getStreak, POINTS } from '@/lib/streaks';

export const GET = withErrorHandler(async () => {
  const userId = await getUserId();
  if (!userId) {
    throw errors.unauthorized();
  }

  const streak = await getStreak(userId);

  return NextResponse.json({
    ...streak,
    pointsTable: POINTS,
  });
});
