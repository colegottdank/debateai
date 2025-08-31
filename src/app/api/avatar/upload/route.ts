import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadAvatar } from '@/lib/r2';
import { d1 } from '@/lib/d1';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get form data with the file
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();

    // Upload directly to R2 using AWS SDK
    const { publicUrl, key } = await uploadAvatar(buffer, file.type);

    // Save avatar URL to database
    await d1.query(
      `UPDATE leaderboard SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      [publicUrl, userId]
    );

    return NextResponse.json({
      publicUrl,
      key,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current avatar URL from database
    const result = await d1.query(
      `SELECT avatar_url FROM leaderboard WHERE user_id = ?`,
      [userId]
    );

    const avatarUrl = result.result?.[0]?.avatar_url || null;

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error('Get avatar error:', error);
    return NextResponse.json(
      { error: 'Failed to get avatar' },
      { status: 500 }
    );
  }
}