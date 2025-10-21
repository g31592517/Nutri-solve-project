#!/usr/bin/env node

/**
 * Simple Chat Response Time Test
 * Measures actual response times for chat queries
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testChatTiming() {
  console.log('⏱️  CHAT RESPONSE TIME TEST');
  console.log('=' .repeat(40));

  // Wait for server to be ready
  console.log('🔍 Checking server status...');
  
  let serverReady = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!serverReady && attempts < maxAttempts) {
    try {
      const healthResponse = await fetch(`${API_BASE}/health`, { timeout: 3000 });
      if (healthResponse.ok) {
        console.log('✅ Server is ready');
        serverReady = true;
      }
    } catch (error) {
      attempts++;
      console.log(`⏳ Waiting for server... (attempt ${attempts}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  if (!serverReady) {
    console.log('❌ Server not responding after 20 seconds');
    return false;
  }

  const testQueries = [
    {
      name: 'Very Short Question',
      message: 'Hi',
      timeout: 15000
    },
    {
      name: 'Simple Nutrition Question',
      message: 'What is protein?',
      timeout: 20000
    },
    {
      name: 'Repeat Question (Cache Test)',
      message: 'What is protein?',
      timeout: 5000
    }
  ];

  console.log('\n📊 Testing Chat Response Times:');
  console.log('-'.repeat(40));

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n${i + 1}. ${query.name}`);
    console.log(`   Query: "${query.message}"`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query.message,
          stream: false 
        }),
        timeout: query.timeout
      });

      const duration = Date.now() - startTime;
      
      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status} (${duration}ms)`);
        continue;
      }

      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ Response received in ${duration}ms`);
        console.log(`   📦 Cached: ${data.cached ? 'Yes' : 'No'}`);
        if (data.cached) {
          console.log(`   🎯 Cache type: ${data.cacheType || 'regular'}`);
        }
        console.log(`   📝 Response: "${data.response?.substring(0, 60) || 'No response'}..."`);
        
        // Performance analysis
        if (data.cached && duration < 500) {
          console.log('   🚀 Excellent cache performance!');
        } else if (data.cached && duration < 2000) {
          console.log('   ⚡ Good cache performance');
        } else if (!data.cached && duration < 10000) {
          console.log('   ✨ Good generation performance');
        } else if (!data.cached && duration < 20000) {
          console.log('   ⏰ Acceptable generation time');
        } else {
          console.log('   🐌 Slow response - may need optimization');
        }
      } else {
        console.log(`   ❌ Chat failed: ${data.error} (${duration}ms)`);
      }

    } catch (error) {
      if (error.message.includes('timeout')) {
        console.log(`   ⏰ Timed out after ${query.timeout}ms`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Wait between requests
    if (i < testQueries.length - 1) {
      console.log('   ⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  console.log('\n' + '='.repeat(40));
  console.log('📈 PERFORMANCE SUMMARY');
  console.log('Expected optimized performance:');
  console.log('- Cache hits: <500ms');
  console.log('- Fresh generation: 5-15 seconds');
  console.log('- Model warm-up benefit: Faster subsequent requests');
  console.log('='.repeat(40));

  return true;
}

// Run the timing test
testChatTiming()
  .then(() => {
    console.log('\n✅ Chat timing test completed');
  })
  .catch(error => {
    console.error('❌ Chat timing test failed:', error);
    process.exit(1);
  });
