import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { debateId, messageIndex } = body;

    if (!debateId || messageIndex === undefined) {
      return NextResponse.json(
        { error: 'Missing debateId or messageIndex' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://debateai.org';
    const url = `${baseUrl}/debate/${debateId}?msg=${messageIndex}`;

    return NextResponse.json({ url });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
