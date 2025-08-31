import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile from database
    const result = await d1.query(
      `SELECT display_name, avatar_url FROM leaderboard WHERE user_id = ?`,
      [userId]
    );

    if (result.success && result.result && result.result.length > 0) {
      const profile = result.result[0];
      return NextResponse.json({
        displayName: profile.display_name,
        avatarUrl: profile.avatar_url,
      });
    }

    return NextResponse.json({ displayName: null, avatarUrl: null });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { displayName } = await request.json();

    if (!displayName || displayName.length > 50) {
      return NextResponse.json(
        { error: 'Invalid display name' },
        { status: 400 }
      );
    }

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
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}