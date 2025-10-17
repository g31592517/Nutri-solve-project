import fetch from 'node-fetch';

const API_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_QUERY = 'Suggest a budget meal plan for nut allergies';

// You'll need a valid JWT token for authentication
const JWT_TOKEN = process.env.TEST_JWT_TOKEN || '';

async function testChat(streaming: boolean = false) {
  console.log('\n' + '='.repeat(80));
  console.log(`Testing ${streaming ? 'STREAMING' : 'NON-STREAMING'} chat endpoint`);
  console.log('='.repeat(80));
  console.log(`Query: "${TEST_QUERY}"`);
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
          message: TEST_QUERY,
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
          message: TEST_QUERY,
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

async function main() {
  console.log('\n🚀 NutriSolve Chat Performance Test');
  console.log('=====================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`Auth: ${JWT_TOKEN ? 'Enabled (JWT provided)' : 'None (testing without auth)'}`);
  
  // Test non-streaming first
  await testChat(false);
  
  // Wait a bit before testing streaming
  console.log('Waiting 2 seconds before streaming test...\n');
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  // Test streaming
  await testChat(true);
  
  console.log('✅ All tests complete!');
  console.log('\n📝 Notes:');
  console.log('   - First request may be slower (model loading)');
  console.log('   - Second request should benefit from caching');
  console.log('   - Streaming provides better perceived performance');
  console.log('   - Target: <10s on low-spec hardware\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
