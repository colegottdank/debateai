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

async function checkDebates() {
  console.log('Checking debates for test-user-123...\n');
  
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`,
      },
      body: JSON.stringify({ 
        sql: 'SELECT id, user_id, opponent, topic, created_at FROM debates WHERE user_id = ?',
        params: ['test-user-123']
      }),
    }
  );
  
  const data = await response.json();
  
  if (data.success && data.result?.[0]?.results) {
    const debates = data.result[0].results;
    console.log(`Found ${debates.length} debates for test-user-123:\n`);
    debates.forEach((debate, i) => {
      console.log(`${i + 1}. ID: ${debate.id}`);
      console.log(`   Topic: ${debate.topic}`);
      console.log(`   Opponent: ${debate.opponent}`);
      console.log(`   Created: ${debate.created_at}\n`);
    });
    
    if (debates.length >= 3) {
      console.log('⚠️  User has reached the free tier limit of 3 debates!');
      console.log('This is why you\'re getting the "debate_limit_exceeded" error.\n');
    }
  } else {
    console.log('No debates found or error:', data.errors);
  }
}

checkDebates().catch(console.error);