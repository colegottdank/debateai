#!/usr/bin/env node
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

async function executeQuery(sql) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({ sql }),
    }
  );

  const data = await response.json();
  return data;
}

async function runMigration() {
  console.log('🚀 Running migration: Add missing columns to users table...\n');

  const queries = [
    "ALTER TABLE users ADD COLUMN current_period_end DATETIME;",
    "ALTER TABLE users ADD COLUMN cancel_at_period_end BOOLEAN DEFAULT FALSE;"
  ];

  for (const sql of queries) {
    console.log(`📋 Executing: ${sql}`);
    const result = await executeQuery(sql);
    if (result.success) {
      console.log(`✅ Success\n`);
    } else {
      // Check if error is "duplicate column name" which is fine (already migrated)
      const errorMsg = JSON.stringify(result.errors || result.error);
      if (errorMsg.includes('duplicate column name')) {
        console.log(`⚠️ Column already exists (skipped)\n`);
      } else {
        console.error(`❌ Failed:`, result.errors);
      }
    }
  }

  console.log('\n🎉 Migration complete!');
}

runMigration().catch(console.error);
