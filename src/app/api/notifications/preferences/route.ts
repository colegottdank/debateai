import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helper';
import { errors, withErrorHandler, validateBody } from '@/lib/api-errors';
import { getPreferences, updatePreferences } from '@/lib/notifications';
import { z } from 'zod';

/**
 * GET /api/notifications/preferences
 *
 * Returns the user's notification preferences.
 */
export const GET = withErrorHandler(async () => {
  const userId = await getUserId();
  if (!userId) {
    throw errors.unauthorized();
  }

  const preferences = await getPreferences(userId);
  return NextResponse.json({ preferences });
});

const preferencesSchema = z.object({
  streakWarning: z.boolean().optional(),
  challenge: z.boolean().optional(),
  scoreResult: z.boolean().optional(),
  milestone: z.boolean().optional(),
});

/**
 * PUT /api/notifications/preferences
 *
 * Update notification preferences. Only provided fields are updated.
 */
export const PUT = withErrorHandler(async (request: Request) => {
  const userId = await getUserId();
  if (!userId) {
    throw errors.unauthorized();
  }

  const body = await validateBody(request, preferencesSchema);

  // Must provide at least one field
  if (Object.keys(body).length === 0) {
    throw errors.badRequest('Provide at least one preference to update');
  }

  const updated = await updatePreferences(userId, body);
  return NextResponse.json({ preferences: updated });
});
