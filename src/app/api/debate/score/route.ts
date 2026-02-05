import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helper';
import { d1 } from '@/lib/d1';
import { getScoringPrompt, DebateScore } from '@/lib/scoring';
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  baseURL: 'https://anthropic.helicone.ai',
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// 5 scoring requests per minute per user (prevents spam-scoring)
const userLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
const ipLimiter = createRateLimiter({ maxRequests: 15, windowMs: 60_000 });

/**
 * POST /api/debate/score
 *
 * Scores a completed debate. Requires at least 2 exchanges (4 messages).
 * Stores the result in the debate's score_data column.
 */
export async function POST(request: Request) {
  const ipRl = ipLimiter.check(getClientIp(request));
  if (!ipRl.allowed) return rateLimitResponse(ipRl);

  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRl = userLimiter.check(`user:${userId}`);
    if (!userRl.allowed) return rateLimitResponse(userRl);

    const { debateId } = await request.json();
    if (!debateId) {
      return NextResponse.json({ error: 'Missing debateId' }, { status: 400 });
    }

    // Fetch the debate
    const debateResult = await d1.getDebate(debateId);
    if (!debateResult.success || !debateResult.debate) {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    const debate = debateResult.debate;

    // Verify ownership
    if (debate.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if already scored
    const existingScoreData = debate.score_data as Record<string, unknown> | null;
    if (existingScoreData?.debateScore) {
      return NextResponse.json({
        score: existingScoreData.debateScore,
        cached: true,
      });
    }

    // Need at least 2 user messages + 2 AI messages to score
    const messages = (debate.messages as Array<{ role: string; content: string }>) || [];
    const userMsgs = messages.filter(m => m.role === 'user');
    const aiMsgs = messages.filter(m => m.role === 'ai');

    if (userMsgs.length < 2 || aiMsgs.length < 2) {
      return NextResponse.json(
        { error: 'Need at least 2 exchanges to score a debate' },
        { status: 400 }
      );
    }

    // Generate score
    const topic = (debate.topic as string) || 'Unknown topic';
    const scoringPrompt = getScoringPrompt(topic, messages);

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: scoringPrompt }],
    }, {
      headers: {
        'Helicone-User-Id': userId,
        'Helicone-RateLimit-Policy': '100;w=86400;s=user',
      },
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON response — handle potential markdown wrapping
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    let score: DebateScore;
    try {
      score = JSON.parse(jsonText) as DebateScore;
    } catch {
      console.error('Failed to parse scoring response:', text);
      return NextResponse.json(
        { error: 'Failed to parse debate score' },
        { status: 500 }
      );
    }

    // Validate score structure
    if (!score.winner || typeof score.userScore !== 'number' || typeof score.aiScore !== 'number') {
      return NextResponse.json(
        { error: 'Invalid score format' },
        { status: 500 }
      );
    }

    // Save score to database — preserve existing score_data fields
    const updatedScoreData = {
      ...existingScoreData,
      debateScore: score,
      scoredAt: new Date().toISOString(),
    };

    await d1.query(
      'UPDATE debates SET score_data = ?, user_score = ?, ai_score = ? WHERE id = ?',
      [
        JSON.stringify(updatedScoreData),
        score.userScore,
        score.aiScore,
        debateId,
      ]
    );

    return NextResponse.json({ score, cached: false });
  } catch (error) {
    console.error('Score debate error:', error);
    return NextResponse.json(
      { error: 'Failed to score debate' },
      { status: 500 }
    );
  }
}
