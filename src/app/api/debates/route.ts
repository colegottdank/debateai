import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helper';
import { d1 } from '@/lib/d1';
import { checkAppDisabled } from '@/lib/app-disabled';
import { errors, withErrorHandler } from '@/lib/api-errors';
import { listDebatesQuerySchema } from '@/lib/api-schemas';

export const GET = withErrorHandler(async (request: Request) => {
  // Check if app is disabled
  const disabledResponse = checkAppDisabled();
  if (disabledResponse) return disabledResponse;

  const userId = await getUserId();

  if (!userId) {
    throw errors.unauthorized();
  }

  // Parse and validate query parameters
  const { searchParams } = new URL(request.url);
  const queryResult = listDebatesQuerySchema.safeParse({
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
  });

  if (!queryResult.success) {
    throw errors.badRequest('Invalid query parameters', {
      fields: queryResult.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }

  const { limit, offset } = queryResult.data;

  // Fetch debates from database
  const result = await d1.query(
    `SELECT 
      id,
      opponent,
      opponent_style,
      topic,
      json_array_length(messages) as message_count,
      created_at,
      score_data
    FROM debates 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  if (result.success && result.result) {
    // Format the debates for the frontend
    const debates = result.result.map((debate: Record<string, unknown>) => {
      // Use opponent_style from database, fallback to score_data if needed
      let opponentStyle = debate.opponent_style;
      if (!opponentStyle && debate.score_data && typeof debate.score_data === 'string') {
        try {
          const scoreData = JSON.parse(debate.score_data);
          opponentStyle = scoreData.opponentStyle;
        } catch {
          // Ignore parse errors
        }
      }

      return {
        id: debate.id,
        opponent: debate.opponent,
        opponentStyle,
        topic: debate.topic,
        messageCount: debate.message_count || 0,
        createdAt: debate.created_at,
      };
    });

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
        hasMore: offset + limit < total,
      },
    });
  }

  return NextResponse.json({
    debates: [],
    pagination: { total: 0, limit, offset, hasMore: false },
  });
});
