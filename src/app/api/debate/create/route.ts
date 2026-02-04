import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';
import { OpponentType } from '@/lib/opponents';
import { getUserId } from '@/lib/auth-helper';
import { checkAppDisabled } from '@/lib/app-disabled';
import { createRateLimiter, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

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
  if (!ipRl.allowed) return rateLimitResponse(ipRl);

  try {
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Per-user rate limit
    const userRl = userLimiter.check(`user:${userId}`);
    if (!userRl.allowed) return rateLimitResponse(userRl);

    const { character: opponent, opponentStyle, topic, debateId } = await request.json();

    if (!topic || !debateId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Use custom style if provided, otherwise use the character type
    const effectiveOpponent = opponent || 'custom';
    const effectiveStyle = opponentStyle || opponent;

    // Get user info for the debate
    const user = await currentUser();
    const username = user?.firstName || user?.username || 'Anonymous';

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
    
    return NextResponse.json({ 
      success: true, 
      debateId: saveResult.debateId || debateId 
    });
  } catch (error) {
    console.error('Create debate error:', error);
    return NextResponse.json(
      { error: 'Failed to create debate' },
      { status: 500 }
    );
  }
}