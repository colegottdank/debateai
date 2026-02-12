import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  // Emergency bypass for Echo's user research
  if (key !== 'openclaw-urgent-bypass') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const countResult = await d1.query('SELECT count(*) as total FROM debates');
    const sampleResult = await d1.query('SELECT * FROM debates LIMIT 5');

    return NextResponse.json({
      totalDebates: countResult.result?.[0]?.total || 0,
      countError: countResult.error,
      samples: sampleResult.result,
      sampleError: sampleResult.error
    });
  } catch (error) {
    console.error('Error fetching abandoned users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
