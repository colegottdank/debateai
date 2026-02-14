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
  console.log('🚀 Creating MISSING tables for DebateAI...\n');

  const tables = [
    // User Stats & Streaks (ensure they exist)
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
    },
    // Notifications
    {
      name: 'notifications',
      sql: `CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link TEXT,
        read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    {
      name: 'notification_preferences',
      sql: `CREATE TABLE IF NOT EXISTS notification_preferences (
        user_id TEXT PRIMARY KEY,
        streak_warning INTEGER DEFAULT 1,
        challenge INTEGER DEFAULT 1,
        score_result INTEGER DEFAULT 1,
        milestone INTEGER DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    },
    // Daily Topics
    {
      name: 'daily_topics',
      sql: `CREATE TABLE IF NOT EXISTS daily_topics (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        persona TEXT NOT NULL,
        persona_id TEXT,
        category TEXT NOT NULL DEFAULT 'general',
        weight REAL NOT NULL DEFAULT 1.0,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    },
    {
      name: 'daily_topic_history',
      sql: `CREATE TABLE IF NOT EXISTS daily_topic_history (
        id TEXT PRIMARY KEY,
        topic_id TEXT NOT NULL,
        shown_date TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (topic_id) REFERENCES daily_topics(id)
      )`
    }
  ];

  const indexes = [
    // User Stats indexes
    { name: 'idx_user_stats_points', sql: 'CREATE INDEX IF NOT EXISTS idx_user_stats_points ON user_streaks(total_points DESC)' },
    { name: 'idx_user_stats_streak', sql: 'CREATE INDEX IF NOT EXISTS idx_user_stats_streak ON user_streaks(current_streak DESC)' },
    { name: 'idx_user_stats_debates', sql: 'CREATE INDEX IF NOT EXISTS idx_user_stats_debates ON user_stats(total_debates DESC)' },
    { name: 'idx_user_stats_week', sql: 'CREATE INDEX IF NOT EXISTS idx_user_stats_week ON user_stats(week_debates DESC)' },
    
    // Notification indexes
    { name: 'idx_notif_user_read', sql: 'CREATE INDEX IF NOT EXISTS idx_notif_user_read ON notifications(user_id, read, created_at DESC)' },
    { name: 'idx_notif_user_created', sql: 'CREATE INDEX IF NOT EXISTS idx_notif_user_created ON notifications(user_id, created_at DESC)' },
    
    // Daily Topic indexes
    { name: 'idx_daily_topics_enabled', sql: 'CREATE INDEX IF NOT EXISTS idx_daily_topics_enabled ON daily_topics(enabled)' },
    { name: 'idx_daily_topics_category', sql: 'CREATE INDEX IF NOT EXISTS idx_daily_topics_category ON daily_topics(category)' },
    { name: 'idx_daily_topic_history_date', sql: 'CREATE INDEX IF NOT EXISTS idx_daily_topic_history_date ON daily_topic_history(shown_date DESC)' },
  ];

  // Create tables
  for (const table of tables) {
    console.log(`📋 Creating table: ${table.name}`);
    const result = await executeQuery(table.sql);
    if (result.success) {
      console.log(`✅ Table ${table.name} created or exists\n`);
    } else {
      console.error(`❌ Failed to create table ${table.name}:`, JSON.stringify(result.errors || result.error));
    }
  }

  // Create indexes
  console.log('\n📑 Creating indexes...');
  for (const index of indexes) {
    const result = await executeQuery(index.sql);
    if (result.success) {
      console.log(`✅ Index ${index.name} created or exists`);
    } else {
      console.error(`❌ Failed to create index ${index.name}:`, JSON.stringify(result.errors || result.error));
    }
  }

  console.log('\n🎉 Database repair complete!');
}

createTables().catch(console.error);
