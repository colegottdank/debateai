import { NextRequest, NextResponse } from 'next/server';

// Development-only test webhook endpoint
const isDev = process.env.NODE_ENV === 'development';

export async function POST(request: NextRequest) {
  if (!isDev) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  console.log('🔔 TEST WEBHOOK HIT');
  
  const body = await request.text();
  console.log('📝 Body length:', body.length);
  
  return NextResponse.json({ 
    success: true, 
    message: 'Test webhook received',
    timestamp: new Date().toISOString()
  });
}

export async function GET() {
  if (!isDev) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ 
    status: 'Test webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
}
