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

async function migrate() {
  console.log('🚀 Migrating votes table...\n');

  const sql = `
      CREATE TABLE IF NOT EXISTS votes (
        debate_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        vote_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (debate_id, user_id)
      );
      CREATE INDEX IF NOT EXISTS idx_votes_debate ON votes(debate_id);
  `;

  const result = await executeQuery(sql);
  if (result.success) {
    console.log('✅ Votes table created successfully');
  } else {
    console.error('❌ Failed to create votes table:', result.errors);
  }
}

migrate().catch(console.error);
