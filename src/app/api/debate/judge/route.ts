import { NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth-helper';
import { getJudgePrompt } from '@/lib/prompts.judge';
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';
import { errors, validateBody } from '@/lib/api-errors';
import { judgeDebateSchema } from '@/lib/api-schemas';
import { logger } from '@/lib/logger';
import Anthropic from '@anthropic-ai/sdk';

const log = logger.scope('debate.judge');

const anthropic = new Anthropic({
  baseURL: 'https://anthropic.helicone.ai',
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});

// 5 judging requests per minute per user
const userLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
const ipLimiter = createRateLimiter({ maxRequests: 15, windowMs: 60_000 });

export async function POST(request: Request) {
  try {
    const ipRl = ipLimiter.check(getClientIp(request));
    if (!ipRl.allowed) {
      return rateLimitResponse(ipRl);
    }

    const userId = await getUserId();
    if (!userId) {
      return errors.unauthorized();
    }

    const userRl = userLimiter.check(`user:${userId}`);
    if (!userRl.allowed) {
      return rateLimitResponse(userRl);
    }

    const { debateId, topic, messages } = await validateBody(request, judgeDebateSchema);

    log.info('judging.started', { debateId, topic: topic.slice(0, 100), messageCount: messages.length });

    // Generate the judging prompt
    const judgePrompt = getJudgePrompt(topic, messages);

    // Use a more powerful model for the final judgment
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1024, // Allow more tokens for the JSON response
      messages: [{ role: 'user', content: judgePrompt }],
    }, {
      headers: {
        'Helicone-User-Id': userId,
      },
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // The prompt instructs the model to return ONLY a valid JSON object.
    let jsonText = text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    let judgment: any;
    try {
      judgment = JSON.parse(jsonText);
    } catch (e) {
      log.error('judging.failed.parse', { debateId, rawResponse: text, error: e instanceof Error ? e.message : String(e) });
      return errors.internal('Failed to parse judge\'s verdict. The AI may have returned an invalid format.');
    }

    log.info('judging.completed', { debateId, winner: judgment.winner });

    // Return the raw JSON judgment for the client to handle
    return NextResponse.json(judgment);

  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    log.error('judging.failed.api', { error: error instanceof Error ? error.message : String(error) });
    return errors.internal('An unexpected error occurred while judging the debate.');
  }
}
