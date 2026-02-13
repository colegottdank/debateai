import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  const validKey = process.env.ADMIN_SECRET;

  if (!validKey || key !== validKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await d1.createTables();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ success: false, error: 'Migration failed' }, { status: 500 });
  }
};
