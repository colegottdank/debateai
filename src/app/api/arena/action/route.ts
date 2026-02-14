import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { getUserId } from '@/lib/auth-helper';
import { updateArenaSchema, ArenaState } from '@/lib/arena-schema';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const result = updateArenaSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error }, { status: 400 });
    }
    
    const { debateId, action, damage } = result.data;
    
    // Get current state
    const current = await d1.getArenaMatch(debateId);
    if (!current.success || !current.state) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }
    
    const state = current.state as ArenaState;
    
    // Apply Action Logic
    const logs: string[] = [];
    
    if (action === 'attack') {
      const dmg = damage || 10;
      state.aiHp = Math.max(0, state.aiHp - dmg);
      state.comboCount += 1;
      logs.push(`User attacked for ${dmg} damage!`);
    } else if (action === 'heal') {
       const heal = 15;
       state.userHp = Math.min(state.maxHp, state.userHp + heal);
       logs.push(`User healed for ${heal} HP.`);
    }
    
    // Check win condition
    let winner: string | null = null;
    if (state.aiHp <= 0) winner = 'user';
    
    // Save state
    await d1.saveArenaState(debateId, state);
    await d1.logArenaTurn(debateId, { action, damage, actor: 'user', result: logs });
    
    if (winner) {
       await d1.query(`UPDATE arena_matches SET winner = ? WHERE id = ?`, [winner, debateId]);
    }

    return NextResponse.json({ success: true, state, logs, winner });

  } catch (error) {
    console.error('Arena action error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
