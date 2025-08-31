import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';

export async function POST() {
  try {
    console.log('Setting up D1 database tables...');
    
    await d1.createTables();
    
    console.log('D1 database tables created successfully!');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database tables created successfully' 
    });
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup database' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to setup database tables' 
  });
}