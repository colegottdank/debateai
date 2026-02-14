import { NextRequest, NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';

export const runtime = 'edge';

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const body = await req.json();
    const { status } = body;
    
    // Validate status
    if (!status || !['pending', 'approved', 'rejected', 'fast_tracked'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    const result = await d1.updateContentReviewStatus(id, status);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to update' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (_error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
