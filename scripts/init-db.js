// Initialize the new DebateAI database schema
const { d1 } = require('../src/lib/d1');

async function initDatabase() {
  console.log('🚀 Initializing DebateAI database...');
  
  try {
    const result = await d1.createTables();
    
    if (result.success) {
      console.log('✅ Database tables created successfully!');
    } else {
      console.error('❌ Failed to create tables:', result.error);
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

initDatabase();