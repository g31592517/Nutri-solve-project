import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_QUERIES = [
  'Suggest a budget meal plan for nut allergies',
  'High protein breakfast ideas',
  'Vegetarian dinner recipes under 500 calories',
  'Meal prep for weight loss',
  'Quick healthy snacks for kids'
];

// You'll need a valid JWT token for authentication
const JWT_TOKEN = process.env.TEST_JWT_TOKEN || '';

async function testChat(query: string, streaming: boolean = false) {
  console.log('\n' + '='.repeat(80));
  console.log(`Testing ${streaming ? 'STREAMING' : 'NON-STREAMING'} chat endpoint`);
  console.log('='.repeat(80));
  console.log(`Query: "${query}"`);
  console.log('Starting test...\n');

  const startTime = Date.now();

  try {
    if (streaming) {
      // Test streaming endpoint
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(JWT_TOKEN && { Authorization: `Bearer ${JWT_TOKEN}` }),
        },
        body: JSON.stringify({
          message: query,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Connection established. Streaming response:\n');
      console.log('-'.repeat(80));

      let fullResponse = '';
      const reader = response.body;

      if (!reader) {
        throw new Error('No response body');
      }

      // Read the stream
      for await (const chunk of reader) {
        const text = chunk.toString();
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              console.log('\n' + '-'.repeat(80));
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                process.stdout.write(parsed.content);
                fullResponse += parsed.content;
              }
              if (parsed.error) {
                console.error('\n❌ Error:', parsed.error);
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log('\n\n📊 Performance Stats:');
      console.log(`   Total time: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`   Response length: ${fullResponse.length} characters`);
      console.log(`   ${duration < 10000 ? '✅ TARGET MET: <10s' : '⚠️  Slower than target (10s)'}`);
    } else {
      // Test non-streaming endpoint
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(JWT_TOKEN && { Authorization: `Bearer ${JWT_TOKEN}` }),
        },
        body: JSON.stringify({
          message: query,
          stream: false,
        }),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const data = await response.json();

      console.log('✅ Response received\n');
      console.log('-'.repeat(80));
      console.log(data.response);
      console.log('-'.repeat(80));

      console.log('\n📊 Performance Stats:');
      console.log(`   Total time: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
      console.log(`   Server time: ${data.ms}ms`);
      console.log(`   Cached: ${data.cached ? 'Yes ⚡' : 'No'}`);
      console.log(`   Response length: ${data.response.length} characters`);
      console.log(`   ${duration < 10000 ? '✅ TARGET MET: <10s' : '⚠️  Slower than target (10s)'}`);
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('\n❌ Error:', error.message);
    console.error(`   Failed after: ${duration}ms`);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('\n💡 Tip: Make sure the backend server is running (npm run start:backend)');
    }
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('\n💡 Tip: You need a valid JWT token. Set TEST_JWT_TOKEN environment variable');
      console.error('   Or remove authentication from the /api/chat route for testing');
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

async function runPerformanceTests() {
  const results: Array<{query: string, time: number, cached: boolean}> = [];
  
  console.log('\n🚀 NutriSolve Enhanced Performance Test Suite');
  console.log('='.repeat(50));
  console.log(`API URL: ${API_URL}`);
  console.log(`Auth: ${JWT_TOKEN ? 'Enabled (JWT provided)' : 'None (testing without auth)'}`);  
  console.log(`Testing ${TEST_QUERIES.length} different queries...\n`);
  
  for (let i = 0; i < TEST_QUERIES.length; i++) {
    const query = TEST_QUERIES[i];
    console.log(`\n📝 Test ${i + 1}/${TEST_QUERIES.length}: ${query.substring(0, 40)}...`);
    
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(JWT_TOKEN && { Authorization: `Bearer ${JWT_TOKEN}` }),
        },
        body: JSON.stringify({
          message: query,
          stream: false,
        }),
      });
      
      const duration = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        results.push({
          query: query.substring(0, 30) + '...',
          time: duration,
          cached: data.cached || false
        });
        
        console.log(`✅ Response: ${duration}ms ${data.cached ? '(cached ⚡)' : '(fresh 🔥)'}`);        
        console.log(`   RAG results: ${data.ragResults || 0}, Priority: ${data.priority || 1}`);
      } else {
        console.log(`❌ Failed: ${response.status}`);
        results.push({ query: query.substring(0, 30) + '...', time: duration, cached: false });
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`❌ Error: ${error.message}`);
      results.push({ query: query.substring(0, 30) + '...', time: duration, cached: false });
    }
    
    // Wait between requests to avoid overwhelming
    if (i < TEST_QUERIES.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Performance Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('='.repeat(50));
  
  const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
  const cacheHits = results.filter(r => r.cached).length;
  const under30s = results.filter(r => r.time < 30000).length;
  const under10s = results.filter(r => r.time < 10000).length;
  
  console.log(`Average Response Time: ${avgTime.toFixed(0)}ms (${(avgTime/1000).toFixed(1)}s)`);
  console.log(`Cache Hit Rate: ${cacheHits}/${results.length} (${((cacheHits/results.length)*100).toFixed(1)}%)`);
  console.log(`Under 30s: ${under30s}/${results.length} (${((under30s/results.length)*100).toFixed(1)}%)`);
  console.log(`Under 10s: ${under10s}/${results.length} (${((under10s/results.length)*100).toFixed(1)}%)`);
  
  // Target Analysis
  if (avgTime < 30000) {
    console.log('\n🎯 TARGET MET: Average under 30s!');
  } else {
    console.log('\n⚠️  TARGET MISSED: Average over 30s');
    console.log('💡 Recommendations:');
    console.log('   - Switch to smaller model (tinyllama:1.1b)');
    console.log('   - Reduce RAG context further (k=1)');
    console.log('   - Enable CPU performance mode');
  }
  
  console.log('\n📋 Individual Results:');
  results.forEach((r, i) => {
    const status = r.time < 10000 ? '🟢' : r.time < 30000 ? '🟡' : '🔴';
    console.log(`   ${status} ${r.query}: ${r.time}ms ${r.cached ? '⚡' : ''}`);
  });
}

async function main() {
  
  // Run comprehensive performance tests
  await runPerformanceTests();
  
  // Test streaming with first query
  console.log('\n🌊 Testing streaming response...');
  await testChat(TEST_QUERIES[0], true);
  
  console.log('\n✅ All tests complete!');
  console.log('\n📝 Optimization Notes:');
  console.log('   - First request loads model (slower)');
  console.log('   - Subsequent requests use caching (faster)');
  console.log('   - Streaming provides better UX');
  console.log('   - Target: <30s average, <10s optimal\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
