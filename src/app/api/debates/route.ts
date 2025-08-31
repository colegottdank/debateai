import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch debates from database
    const result = await d1.query(
      `SELECT 
        id,
        character,
        topic,
        json_array_length(messages) as message_count,
        created_at
      FROM debates 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    if (result.success && result.result) {
      // Format the debates for the frontend
      const debates = result.result.map((debate: Record<string, unknown>) => ({
        id: debate.id,
        character: debate.character,
        topic: debate.topic,
        messageCount: debate.message_count || 0,
        createdAt: debate.created_at,
      }));

      // Get total count for pagination
      const countResult = await d1.query(
        `SELECT COUNT(*) as total FROM debates WHERE user_id = ?`,
        [userId]
      );

      const total = (countResult.result?.[0]?.total as number) || 0;

      return NextResponse.json({ 
        debates,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    }

    return NextResponse.json({ debates: [], pagination: { total: 0, limit, offset, hasMore: false } });
  } catch (error) {
    console.error('Error fetching debates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debates' },
      { status: 500 }
    );
  }
}