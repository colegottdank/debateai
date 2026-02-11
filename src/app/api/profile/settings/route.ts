import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserId } from '@/lib/auth-helper';
import { withErrorHandler, errors, validateBody } from '@/lib/api-errors';
import { getProfileByUserId, upsertProfile, generateUsername } from '@/lib/profiles';
import { currentUser } from '@clerk/nextjs/server';

const updateSchema = z.object({
  username: z.string().regex(/^[a-z0-9_-]{3,30}$/, 'Username must be 3-30 chars, lowercase alphanumeric/hyphens/underscores').optional(),
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(160).optional().nullable(),
  isPublic: z.boolean().optional(),
});

/**
 * GET /api/profile/settings
 *
 * Returns the current user's profile settings.
 * Auto-creates a profile if none exists.
 */
export const GET = withErrorHandler(async () => {
  const userId = await getUserId();
  if (!userId) throw errors.unauthorized();

  let profile = await getProfileByUserId(userId);

  // Auto-create profile on first access
  if (!profile) {
    const user = await currentUser();
    const name = user?.firstName || user?.username || 'debater';
    const username = generateUsername(name);
    const displayName = user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName.charAt(0)}.` : ''}`
      : name;

    await upsertProfile(userId, { username, displayName });
    profile = await getProfileByUserId(userId);
  }

  return NextResponse.json(profile);
});

/**
 * PATCH /api/profile/settings
 *
 * Update profile fields. Auth required.
 */
export const PATCH = withErrorHandler(async (request: Request) => {
  const userId = await getUserId();
  if (!userId) throw errors.unauthorized();

  const data = await validateBody(request, updateSchema);

  // Get current profile
  const existing = await getProfileByUserId(userId);
  if (!existing) {
    throw errors.notFound('Profile not found. GET /api/profile/settings first to create one.');
  }

  const result = await upsertProfile(userId, {
    username: data.username || existing.username,
    displayName: data.displayName || existing.displayName,
    bio: data.bio !== undefined ? (data.bio || undefined) : (existing.bio || undefined),
    isPublic: data.isPublic !== undefined ? data.isPublic : existing.isPublic,
  });

  if (!result.success) {
    throw errors.badRequest(result.error || 'Failed to update profile');
  }

  const updated = await getProfileByUserId(userId);
  return NextResponse.json(updated);
});
