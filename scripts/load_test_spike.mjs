import fetch from 'node-fetch';

const TARGET_URL = 'http://localhost:3005/api/debate';
const CONCURRENCY = 5; 
const DELAY_MS = 200;

async function startDebate(i) {
  const userId = `load_test_user_${i}_${Date.now()}`;
  console.log(`[${i}] Starting debate for user ${userId}`);
  const start = Date.now();
  
  try {
    const response = await fetch(TARGET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-load-test-user-id': userId
      },
      body: JSON.stringify({
        topic: `Load Test Topic ${i}`,
        previousMessages: [],
        character: 'Socrates',
        userArgument: 'Load testing is fun.',
      })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
    }

    let ttfb = 0;
    let bytes = 0;
    
    for await (const chunk of response.body) {
        if (ttfb === 0) {
            ttfb = Date.now() - start;
            console.log(`[${i}] TTFB: ${ttfb}ms`);
        }
        bytes += chunk.length;
    }
    
    const duration = Date.now() - start;
    console.log(`[${i}] Finished: ${duration}ms, ${bytes} bytes`);
    return { success: true, duration, ttfb };
  } catch (e) {
    console.error(`[${i}] Failed: ${e.message}`);
    return { success: false, error: e.message };
  }
}

async function run() {
    console.log(`Starting load test with concurrency ${CONCURRENCY}`);
    const promises = [];
    for (let i = 0; i < CONCURRENCY; i++) {
        promises.push(new Promise(resolve => setTimeout(() => resolve(startDebate(i)), i * DELAY_MS)));
    }
    const results = await Promise.all(promises);
    const success = results.filter(r => r.success).length;
    console.log(`Summary: ${success}/${CONCURRENCY} passed.`);
}

run();
