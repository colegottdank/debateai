import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { getUserId } from '@/lib/auth-helper';

export const runtime = 'edge';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await d1.getArenaMatch(id);
    if (!result.success || !result.state) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, state: result.state });
  } catch (error) {
    console.error('Arena get error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
