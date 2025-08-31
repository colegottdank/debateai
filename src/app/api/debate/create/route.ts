import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';
import { OpponentType } from '@/lib/opponents';
import { getUserId } from '@/lib/auth-helper';

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check rate limit (skip in test mode)
    const isTestMode = process.env.NEXT_PUBLIC_TEST_MODE === 'true';
    if (!isTestMode) {
      const debateLimit = await d1.checkUserDebateLimit(userId);
      if (!debateLimit.allowed) {
        return NextResponse.json({ 
          error: 'debate_limit_exceeded',
          message: `You've reached your limit of ${debateLimit.limit} debates. Upgrade to premium for unlimited debates!`,
          current: debateLimit.count,
          limit: debateLimit.limit,
          upgrade_required: true
        }, { status: 429 });
      }
    }

    const { character: opponent, topic, debateId } = await request.json();

    if (!opponent || !topic || !debateId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user info for the debate
    const user = await currentUser();
    const username = user?.firstName || user?.username || 'Anonymous';

    // Create initial debate with welcome message
    const initialMessages = [{
      role: 'system',
      content: `Welcome to the debate arena! Today's topic: "${topic}". Your opponent will argue against you using ${(opponent as string).toUpperCase()} reasoning.`
    }];
    
    // Save the debate to the database
    const saveResult = await d1.saveDebate({
      userId,
      opponent: opponent as OpponentType,
      topic,
      messages: initialMessages,
      debateId
    });
    
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