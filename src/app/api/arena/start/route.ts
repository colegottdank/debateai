import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { getUserId } from '@/lib/auth-helper';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, opponent } = await req.json().catch(() => ({}));
    
    // Create debate first (standard flow)
    const debateRes = await d1.saveDebate({
      userId,
      opponent: opponent || 'claude-3-5-sonnet',
      topic: topic || 'Arena Battle',
      messages: [],
      opponentStyle: 'arena', // Special style
    });

    if (!debateRes.success || !debateRes.debateId) {
      return NextResponse.json({ error: 'Failed to create debate' }, { status: 500 });
    }

    // Initialize Arena Match
    const arenaRes = await d1.createArenaMatch({
      debateId: debateRes.debateId,
      userId,
      userHp: 100,
      aiHp: 100,
      maxHp: 100
    });

    if (!arenaRes.success) {
      return NextResponse.json({ error: 'Failed to initialize arena' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      debateId: debateRes.debateId,
      state: {
        userHp: 100,
        aiHp: 100,
        maxHp: 100,
        comboCount: 0,
        userEffects: [],
        aiEffects: [],
        turnCount: 0
      }
    });

  } catch (error) {
    console.error('Arena start error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
