import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';
import { OpponentType } from '@/lib/opponents';
import { getUserId } from '@/lib/auth-helper';
import { checkAppDisabled } from '@/lib/app-disabled';
import { createRateLimiter, getClientIp } from '@/lib/rate-limit';
import { errors, validateBody, withRateLimitHeaders } from '@/lib/api-errors';
import { createDebateSchema } from '@/lib/api-schemas';
import { sendEmail } from '@/lib/email';
import { welcomeEmail } from '@/lib/email-templates';
import { getOrCreatePreferences } from '@/lib/email-preferences';

// 10 debates per minute per user (generous for normal use, blocks abuse)
const userLimiter = createRateLimiter({ maxRequests: 10, windowMs: 60_000 });
// 30 per minute per IP as a fallback for pre-auth requests
const ipLimiter = createRateLimiter({ maxRequests: 30, windowMs: 60_000 });

export async function POST(request: Request) {
  // Check if app is disabled
  const disabledResponse = checkAppDisabled();
  if (disabledResponse) return disabledResponse;

  // IP-based rate limit first (before auth, which is expensive)
  const ipRl = ipLimiter.check(getClientIp(request));
  if (!ipRl.allowed) {
    return errors.rateLimited({
      limit: ipRl.remaining + 1,
      remaining: ipRl.remaining,
      reset: Math.ceil(ipRl.resetAt / 1000),
    });
  }

  try {
    const userId = await getUserId();
    
    if (!userId) {
      return errors.unauthorized();
    }

    // Per-user rate limit
    const userRl = userLimiter.check(`user:${userId}`);
    if (!userRl.allowed) {
      return errors.rateLimited({
        limit: 10,
        remaining: userRl.remaining,
        reset: Math.ceil(userRl.resetAt / 1000),
      });
    }

    // Validate request body with Zod
    const { character: opponent, opponentStyle, topic, debateId } = await validateBody(
      request,
      createDebateSchema
    );
    
    // Use custom style if provided, otherwise use the character type
    const effectiveOpponent = opponent || 'custom';

    // Get user info for the debate
    const user = await currentUser();

    // Create initial debate with welcome message
    const initialMessages = [{
      role: 'system',
      content: `Welcome to the debate arena! Today's topic: "${topic}".${opponentStyle ? ` Your opponent's style: ${opponentStyle}` : ''}`
    }];
    
    // Save the debate to the database with custom opponent info
    const saveResult = await d1.saveDebate({
      userId,
      opponent: effectiveOpponent as OpponentType,
      topic,
      messages: initialMessages,
      debateId,
      opponentStyle // Save the custom style for later use
    } as any);
    
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'Failed to create debate');
    }
    
    // ── Send welcome email on first debate (non-blocking) ──
    try {
      const countResult = await d1.query(
        'SELECT COUNT(*) as cnt FROM debates WHERE user_id = ?',
        [userId],
      );
      const debateCount = (countResult.result?.[0]?.cnt as number) || 0;

      if (debateCount === 1 && user?.emailAddresses?.[0]?.emailAddress) {
        const userEmail = user.emailAddresses[0].emailAddress;
        const prefs = await getOrCreatePreferences(userId, userEmail);
        const { subject, html } = welcomeEmail({
          name: user.firstName || undefined,
          unsubscribeToken: prefs.unsubscribe_token,
        });
        sendEmail({ to: userEmail, subject, html, tags: [{ name: 'type', value: 'welcome' }] }).catch(() => {});
      }
    } catch {
      // Non-blocking — debate creation still succeeds
    }

    // Return success with rate limit headers
    const response = NextResponse.json({ 
      success: true, 
      debateId: saveResult.debateId || debateId 
    });

    return withRateLimitHeaders(response, {
      limit: 10,
      remaining: userRl.remaining,
      reset: Math.ceil(userRl.resetAt / 1000),
    });
  } catch (error) {
    // If it's already a NextResponse (from validateBody), return it
    if (error instanceof NextResponse) {
      return error;
    }

    console.error('Create debate error:', error);
    return errors.internal('Failed to create debate');
  }
}
