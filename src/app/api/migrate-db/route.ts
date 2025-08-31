import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';

export async function POST() {
  try {
    console.log('Running database migration...');
    
    // Add score_data column if it doesn't exist
    const alterTableQuery = `
      ALTER TABLE debates ADD COLUMN score_data TEXT;
    `;
    
    try {
      await d1.query(alterTableQuery);
      console.log('Added score_data column to debates table');
    } catch (error: unknown) {
      // Column might already exist, which is fine
      if (error && typeof error === 'object' && 'error' in error && 
          typeof error.error === 'object' && error.error && 'message' in error.error &&
          typeof error.error.message === 'string' && 
          error.error.message.includes('duplicate column name')) {
        console.log('score_data column already exists');
      } else {
        throw error;
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database migration completed successfully' 
    });
  } catch (error) {
    console.error('Database migration error:', error);
    return NextResponse.json(
      { error: 'Failed to run migration' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Use POST to run database migration' 
  });
}