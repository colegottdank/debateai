import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  // Emergency bypass
  if (key !== 'openclaw-urgent-bypass') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Query for all users
    const result = await d1.query(`
      SELECT 
        u.display_name as name,
        u.email,
        u.created_at,
        COUNT(d.id) as debate_count
      FROM users u
      LEFT JOIN debates d ON u.user_id = d.user_id
      WHERE u.email IS NOT NULL
      GROUP BY u.user_id
      ORDER BY u.created_at DESC
    `);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const rows = result.result || [];
    
    // Convert to CSV
    const csvHeader = 'Name,Email,Date,Debates\n';
    const csvRows = rows.map((r: any) => {
      // Escape quotes
      const name = (r.name || 'Anonymous').replace(/"/g, '""');
      const email = (r.email || '').replace(/"/g, '""');
      return `"${name}","${email}","${r.created_at}",${r.debate_count}`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="users-export.csv"',
      },
    });

  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
