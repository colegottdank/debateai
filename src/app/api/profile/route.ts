import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth, currentUser } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';
import { errors, validateBody, withErrorHandler } from '@/lib/api-errors';
import { getOrCreatePreferences } from '@/lib/email-preferences';
import { sendEmail } from '@/lib/email';
import { welcomeEmail } from '@/lib/email-templates';

// Schema for profile update
const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be 50 characters or less'),
});

export const GET = withErrorHandler(async () => {
  const { userId } = await auth();

  if (!userId) {
    throw errors.unauthorized();
  }

  // Get user profile from database
  const result = await d1.query(
    `SELECT display_name, avatar_url FROM leaderboard WHERE user_id = ?`,
    [userId]
  );

  if (result.success && result.result && result.result.length > 0) {
    const profile = result.result[0] as Record<string, unknown>;
    return NextResponse.json({
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url,
    });
  }

  return NextResponse.json({ displayName: null, avatarUrl: null });
});

export const POST = withErrorHandler(async (request: Request) => {
  const { userId } = await auth();

  if (!userId) {
    throw errors.unauthorized();
  }

  const { displayName } = await validateBody(request, updateProfileSchema);

  // Check if user exists in leaderboard
  const existing = await d1.query(
    `SELECT user_id FROM leaderboard WHERE user_id = ?`,
    [userId]
  );

  if (existing.success && existing.result && existing.result.length > 0) {
    // Update existing
    await d1.query(
      `UPDATE leaderboard SET display_name = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [displayName, userId]
    );
  } else {
    // Insert new
    await d1.query(
      `INSERT INTO leaderboard (user_id, username, display_name, total_score, debates_won, debates_total) 
       VALUES (?, ?, ?, 0, 0, 0)`,
      [userId, displayName, displayName]
    );

    // Send welcome email
    try {
      const user = await currentUser();
      const email = user?.emailAddresses?.[0]?.emailAddress;

      if (email) {
        const prefs = await getOrCreatePreferences(userId, email);
        const { subject, html } = welcomeEmail({
          name: displayName,
          unsubscribeToken: prefs.unsubscribe_token,
        });

        await sendEmail({
          to: email,
          subject,
          html,
          tags: [{ name: 'category', value: 'welcome' }],
        });
      }
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Fail silently to not block profile creation
    }
  }

  return NextResponse.json({ success: true });
});
