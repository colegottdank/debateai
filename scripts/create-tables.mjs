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

async function createTables() {
  console.log('🚀 Creating tables for DebateAI...\n');

  const tables = [
    {
      name: 'debates',
      sql: `CREATE TABLE IF NOT EXISTS debates (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        opponent TEXT NOT NULL,
        topic TEXT NOT NULL,
        messages TEXT NOT NULL,
        user_score INTEGER DEFAULT 0,
        ai_score INTEGER DEFAULT 0,
        score_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'users',
      sql: `CREATE TABLE IF NOT EXISTS users (
        user_id TEXT PRIMARY KEY,
        email TEXT,
        username TEXT,
        display_name TEXT,
        avatar_url TEXT,
        is_premium BOOLEAN DEFAULT FALSE,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        subscription_status TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'subscriptions',
      sql: `CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        stripe_subscription_id TEXT NOT NULL,
        stripe_customer_id TEXT NOT NULL,
        status TEXT NOT NULL,
        current_period_start DATETIME,
        current_period_end DATETIME,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'user_streaks',
      sql: `CREATE TABLE IF NOT EXISTS user_streaks (
        user_id TEXT PRIMARY KEY,
        current_streak INTEGER DEFAULT 0,
        longest_streak INTEGER DEFAULT 0,
        last_debate_date TEXT,
        total_points INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'user_stats',
      sql: `CREATE TABLE IF NOT EXISTS user_stats (
        user_id TEXT PRIMARY KEY,
        display_name TEXT,
        total_debates INTEGER DEFAULT 0,
        total_wins INTEGER DEFAULT 0,
        total_draws INTEGER DEFAULT 0,
        total_losses INTEGER DEFAULT 0,
        total_score REAL DEFAULT 0,
        week_debates INTEGER DEFAULT 0,
        week_wins INTEGER DEFAULT 0,
        week_score REAL DEFAULT 0,
        week_start TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    }
  ];

  const indexes = [
    { name: 'idx_debates_user', sql: 'CREATE INDEX IF NOT EXISTS idx_debates_user ON debates(user_id)' },
    { name: 'idx_debates_created', sql: 'CREATE INDEX IF NOT EXISTS idx_debates_created ON debates(created_at DESC)' },
    { name: 'idx_users_email', sql: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)' },
    { name: 'idx_subscriptions_user', sql: 'CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)' },
    { name: 'idx_user_stats_points', sql: 'CREATE INDEX IF NOT EXISTS idx_user_stats_points ON user_streaks(total_points DESC)' },
    { name: 'idx_user_stats_streak', sql: 'CREATE INDEX IF NOT EXISTS idx_user_stats_streak ON user_streaks(current_streak DESC)' },
    { name: 'idx_user_stats_debates', sql: 'CREATE INDEX IF NOT EXISTS idx_user_stats_debates ON user_stats(total_debates DESC)' },
    { name: 'idx_user_stats_week', sql: 'CREATE INDEX IF NOT EXISTS idx_user_stats_week ON user_stats(week_debates DESC)' },
  ];

  // Create tables
  for (const table of tables) {
    console.log(`📋 Creating table: ${table.name}`);
    const result = await executeQuery(table.sql);
    if (result.success) {
      console.log(`✅ Table ${table.name} created successfully\n`);
    } else {
      console.error(`❌ Failed to create table ${table.name}:`, result.errors);
    }
  }

  // Create indexes
  console.log('\n📑 Creating indexes...');
  for (const index of indexes) {
    const result = await executeQuery(index.sql);
    if (result.success) {
      console.log(`✅ Index ${index.name} created`);
    } else {
      console.error(`❌ Failed to create index ${index.name}:`, result.errors);
    }
  }

  console.log('\n🎉 Database setup complete!');
}

createTables().catch(console.error);