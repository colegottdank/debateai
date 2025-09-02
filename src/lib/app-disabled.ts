import { NextResponse } from 'next/server';

/**
 * Check if the app is disabled and return appropriate response
 */
export function checkAppDisabled() {
  if (process.env.APP_DISABLED === 'true') {
    return NextResponse.json(
      { 
        error: 'Service temporarily unavailable',
        message: 'DebateAI is currently undergoing maintenance. Please check back soon!'
      },
      { status: 503 }
    );
  }
  return null;
}