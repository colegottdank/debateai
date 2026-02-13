#!/usr/bin/env node
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function exportUsers() {
  if (!ACCOUNT_ID || !DATABASE_ID || !API_TOKEN) {
    console.error('❌ Missing D1 credentials. Please set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, and CLOUDFLARE_API_TOKEN in .env.local');
    process.exit(1);
  }

  console.log('🔍 Querying for all users...');

  const sql = `
    SELECT 
      u.display_name as name,
      u.email,
      u.created_at,
      COUNT(d.id) as debate_count
    FROM users u
    LEFT JOIN debates d ON u.user_id = d.user_id
    WHERE u.email IS NOT NULL
    GROUP BY u.user_id
    ORDER BY u.created_at DESC;
  `;

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_TOKEN}`,
        },
        body: JSON.stringify({ sql, params: [] }),
      }
    );

    const data = await response.json();

    if (data.success && data.result?.[0]?.results) {
      const rows = data.result[0].results;
      console.log(`✅ Found ${rows.length} users.`);
      
      if (rows.length > 0) {
        const csvHeader = 'Name,Email,Date,Debates\n';
        const csvRows = rows.map(r => `"${r.name || 'Anonymous'}","${r.email}","${r.created_at}",${r.debate_count}`).join('\n');
        const csvContent = csvHeader + csvRows;
        
        const outputPath = join(__dirname, '..', 'all_users.csv');
        fs.writeFileSync(outputPath, csvContent);
        console.log(`📄 Exported to ${outputPath}`);
      }
    } else {
      console.error('❌ Query failed:', data.errors || data.error);
    }
  } catch (error) {
    console.error('❌ Error executing query:', error);
  }
}

exportUsers();
