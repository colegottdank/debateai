const TARGET_URL = process.env.TARGET_URL || 'https://debateai.org';
const CONCURRENCY = 50;

console.log(`🚀 Starting load test against ${TARGET_URL} with ${CONCURRENCY} concurrent requests...`);

async function runRequest(index) {
  const debateId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${TARGET_URL}/api/debate/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        debateId: debateId,
        topic: `Load Test Topic ${index}`,
        character: 'Socrates',
        opponentStyle: 'Socratic Method'
      })
    });

    const duration = Date.now() - startTime;
    const status = response.status;
    let success = false;
    let data = {};

    if (status === 200) {
      data = await response.json();
      success = data.success;
    } else {
      const text = await response.text();
      console.error(`❌ Request ${index} failed: ${status} - ${text.slice(0, 100)}`);
    }

    return { index, duration, status, success, isGuest: data.isGuest };

  } catch (error) {
    console.error(`❌ Request ${index} error:`, error.message);
    return { index, duration: Date.now() - startTime, status: 0, success: false, error: error.message };
  }
}

async function main() {
  const promises = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    promises.push(runRequest(i));
  }

  const results = await Promise.all(promises);
  
  const successCount = results.filter(r => r.success).length;
  const guestCount = results.filter(r => r.isGuest).length;
  const avgDuration = results.reduce((acc, r) => acc + r.duration, 0) / results.length;
  
  console.log('\n📊 Load Test Results:');
  console.log(`Total Requests: ${CONCURRENCY}`);
  console.log(`Success: ${successCount} (${(successCount/CONCURRENCY)*100}%)`);
  console.log(`Failed: ${CONCURRENCY - successCount}`);
  console.log(`Guest Sessions: ${guestCount}`);
  console.log(`Avg Duration: ${avgDuration.toFixed(2)}ms`);

  if (successCount === CONCURRENCY) {
    console.log('✅ PASS: All requests handled successfully.');
    process.exit(0);
  } else {
    console.log('⚠️ FAIL: Some requests failed.');
    process.exit(1);
  }
}

main();
