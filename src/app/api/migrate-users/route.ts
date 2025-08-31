import { NextResponse } from 'next/server';
import { d1 } from '@/lib/d1';

export async function POST() {
  try {
    // Create users table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        clerk_user_id TEXT PRIMARY KEY,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        stripe_plan TEXT,
        subscription_status TEXT,
        current_period_end TEXT,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const result = await d1.query(createTableQuery);

    return NextResponse.json({ 
      success: true, 
      message: 'Users table created successfully',
      result 
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}