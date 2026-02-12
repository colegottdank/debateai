import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  // TODO: Implement win-back logic
  // 1. Find users inactive for 7 days
  // 2. Filter out those who have already received a win-back email recently
  // 3. Send win-back email
  return NextResponse.json({ message: 'Not implemented yet' });
}

export async function GET(request: NextRequest) {
  return POST(request);
}
