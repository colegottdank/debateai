import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const testUserId = searchParams.get('userId') || 'test-user-1735033838651'; // Use the test user ID from our checkout
  
  try {
    const user = await d1.getUser(testUserId);
    const debateLimit = await d1.checkUserDebateLimit(testUserId);
    
    return NextResponse.json({
      testUserId,
      user,
      debateLimit,
      message: user ? 'User found in database' : 'User not found'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || 'Failed to check status',
      testUserId 
    }, { status: 500 });
  }
}