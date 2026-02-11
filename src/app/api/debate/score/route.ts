import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helper';
import { d1 } from '@/lib/d1';
import { getScoringPrompt, DebateScore } from '@/lib/scoring';
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { errors, withErrorHandler, validateBody } from '@/lib/api-errors';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { recordDebateCompletion } from '@/lib/streaks';
import { notifyScoreResult, notifyStreakMilestone } from '@/lib/notifications';
import { currentUser } from '@clerk/nextjs/server';

const log = logger.scope('debate.score');

const anthropic = new Anthropic({
  baseURL: 'https://anthropic.helicone.ai',
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// Simple schema for score endpoint
const scoreRequestSchema = z.object({
  debateId: z.string().min(1, 'Debate ID is required'),
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
export const POST = withErrorHandler(async (request: Request) => {
  const ipRl = ipLimiter.check(getClientIp(request));
  if (!ipRl.allowed) {
    return rateLimitResponse(ipRl) as unknown as NextResponse;
  }

  const userId = await getUserId();
  if (!userId) {
    throw errors.unauthorized();
  }

  const userRl = userLimiter.check(`user:${userId}`);
  if (!userRl.allowed) {
    return rateLimitResponse(userRl) as unknown as NextResponse;
  }

  const { debateId } = await validateBody(request, scoreRequestSchema);

  // Fetch the debate
  const debateResult = await d1.getDebate(debateId);
  if (!debateResult.success || !debateResult.debate) {
    throw errors.notFound('Debate not found');
  }

  const debate = debateResult.debate;

  // Verify ownership
  if (debate.user_id !== userId) {
    throw errors.forbidden('You do not have access to this debate');
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
    throw errors.badRequest('Need at least 2 exchanges to score a debate');
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
    throw errors.internal('Failed to parse debate score');
  }

  // Validate score structure
  if (!score.winner || typeof score.userScore !== 'number' || typeof score.aiScore !== 'number') {
    throw errors.internal('Invalid score format returned');
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

  // ── Update streak + points + leaderboard ────────────────
  try {
    const user = await currentUser();
    const displayName = user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName.charAt(0)}.` : ''}`
      : user?.username || undefined;

    const debateResult2 = score.winner === 'user' ? 'win' : score.winner === 'ai' ? 'loss' : 'draw';
    const streakResult = await recordDebateCompletion(userId, debateResult2, score.userScore, displayName);

    // Fire notifications (non-blocking)
    await notifyScoreResult(userId, topic, debateResult2, score.userScore, debateId);
    if (streakResult) {
      await notifyStreakMilestone(userId, streakResult.currentStreak);
    }
  } catch (err) {
    // Non-blocking — scoring still succeeds even if streak/notification update fails
    console.error('Failed to update streak/points/notifications:', err);
  }

  log.info('completed', {
    debateId,
    winner: score.winner,
    userScore: score.userScore,
    aiScore: score.aiScore,
  });

  return NextResponse.json({ score, cached: false });
});
