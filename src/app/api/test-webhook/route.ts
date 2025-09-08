import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
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
  return NextResponse.json({ 
    status: 'Test webhook endpoint is working',
    timestamp: new Date().toISOString()
  });
}