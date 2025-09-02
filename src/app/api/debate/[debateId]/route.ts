import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';
import { getUserId } from '@/lib/auth-helper';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ debateId: string }> }
) {
  try {
    const { debateId } = await params;
    const userId = await getUserId();  // May be null for non-authenticated users
    
    if (!debateId) {
      return NextResponse.json({ error: 'Debate ID required' }, { status: 400 });
    }

    const result = await d1.getDebate(debateId);
    
    if (result.success && result.debate) {
      // Check if current user owns this debate (only if authenticated)
      const isOwner = userId ? result.debate.user_id === userId : false;
      const isAuthenticated = !!userId;
      
      return NextResponse.json({ 
        debate: result.debate,
        isOwner,
        isAuthenticated 
      });
    } else {
      return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Get debate error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve debate' },
      { status: 500 }
    );
  }
}