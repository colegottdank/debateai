import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { d1 } from '@/lib/d1';
import { OpponentType } from '@/lib/opponents';
import { getUserId } from '@/lib/auth-helper';
import { checkAppDisabled } from '@/lib/app-disabled';

export async function POST(request: Request) {
  // Check if app is disabled
  const disabledResponse = checkAppDisabled();
  if (disabledResponse) return disabledResponse;

  try {
    const userId = await getUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // No debate creation limit - Vercel rate limiting handles bot protection

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