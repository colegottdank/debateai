/**
 * GET  /api/email/preferences  — Get current user's email preferences
 * PATCH /api/email/preferences — Update email preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helper';
import { getOrCreatePreferences, updatePreferences } from '@/lib/email-preferences';
import { d1 } from '@/lib/d1';

export const runtime = 'nodejs';

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's email from Clerk/D1
  const user = await d1.getUser(userId);
  const email = (user?.email as string) || '';

  if (!email) {
    return NextResponse.json({ error: 'No email on file' }, { status: 400 });
  }

  const prefs = await getOrCreatePreferences(userId, email);

  return NextResponse.json({
    daily_digest: !!prefs.daily_digest,
    challenge_notify: !!prefs.challenge_notify,
    weekly_recap: !!prefs.weekly_recap,
    unsubscribed: !!prefs.unsubscribed_at,
    email: prefs.email,
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { daily_digest, challenge_notify, weekly_recap } = body as {
      daily_digest?: boolean;
      challenge_notify?: boolean;
      weekly_recap?: boolean;
    };

    // Ensure preferences record exists
    const user = await d1.getUser(userId);
    const email = (user?.email as string) || '';
    if (!email) {
      return NextResponse.json({ error: 'No email on file' }, { status: 400 });
    }

    await getOrCreatePreferences(userId, email);

    // Update
    const patch: Record<string, number> = {};
    if (daily_digest !== undefined) patch.daily_digest = daily_digest ? 1 : 0;
    if (challenge_notify !== undefined) patch.challenge_notify = challenge_notify ? 1 : 0;
    if (weekly_recap !== undefined) patch.weekly_recap = weekly_recap ? 1 : 0;

    const success = await updatePreferences(userId, patch);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    const updated = await getOrCreatePreferences(userId, email);

    return NextResponse.json({
      daily_digest: !!updated.daily_digest,
      challenge_notify: !!updated.challenge_notify,
      weekly_recap: !!updated.weekly_recap,
      unsubscribed: !!updated.unsubscribed_at,
    });
  } catch (error) {
    console.error('Update email preferences error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
