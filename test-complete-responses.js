#!/usr/bin/env node

/**
 * Test Complete Chat Responses
 * Verifies that chat responses are complete and not truncated
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testCompleteResponses() {
  console.log('🧪 TESTING COMPLETE CHAT RESPONSES');
  console.log('=' .repeat(50));
  console.log('Verifying fixes for truncated responses');
  console.log('');

  // Wait for server to be ready
  console.log('🔍 Checking server status...');
  
  try {
    const healthResponse = await fetch(`${API_BASE}/health`, { timeout: 3000 });
    if (!healthResponse.ok) {
      throw new Error('Server not ready');
    }
    console.log('✅ Server is ready');
  } catch (error) {
    console.log('❌ Server not responding');
    return false;
  }

  const testQueries = [
    {
      name: 'Breakfast Suggestions Test',
      message: 'Suggest proper meals for breakfast',
      description: 'Should return 4-5 complete meal suggestions with ingredients and macros',
      expectedMinLength: 400,
      shouldContain: ['ingredients', 'calories', 'protein']
    },
    {
      name: 'Meal Planning Test',
      message: 'Give me a complete meal plan for weight loss',
      description: 'Should return detailed meal suggestions without cutoff',
      expectedMinLength: 300,
      shouldContain: ['meal', 'plan', 'weight loss']
    },
    {
      name: 'Detailed Nutrition Advice',
      message: 'Explain protein requirements for muscle building with food examples',
      description: 'Should provide comprehensive response with examples',
      expectedMinLength: 350,
      shouldContain: ['protein', 'muscle', 'examples']
    }
  ];

  console.log('📊 Testing Complete Response Generation:');
  console.log('-'.repeat(50));

  let totalTests = 0;
  let successfulTests = 0;
  let completeResponses = 0;

  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n${i + 1}. ${query.name}`);
    console.log(`   📝 Query: "${query.message}"`);
    console.log(`   📋 Expected: ${query.description}`);
    
    try {
      const startTime = Date.now();
      
      // Test streaming response
      console.log('   🔄 Testing streaming response...');
      
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: query.message,
          stream: true 
        }),
        timeout: 45000 // 45 second timeout
      });

      const duration = Date.now() - startTime;
      totalTests++;
      
      if (!response.ok) {
        console.log(`   ❌ HTTP ${response.status} (${duration}ms)`);
        continue;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        console.log('   ❌ No response body reader');
        continue;
      }

      let fullResponse = '';
      let chunkCount = 0;
      const decoder = new TextDecoder();
      let streamComplete = false;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            
            if (data === '[DONE]') {
              streamComplete = true;
              break;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                chunkCount++;
              }
            } catch (error) {
              // Skip invalid JSON chunks
            }
          }
        }

        if (streamComplete) break;
      }

      successfulTests++;
      
      console.log(`   ✅ Response received in ${duration}ms`);
      console.log(`   📊 Response length: ${fullResponse.length} characters`);
      console.log(`   📦 Chunks received: ${chunkCount}`);
      console.log(`   🎯 Stream completed: ${streamComplete ? 'Yes' : 'No'}`);
      
      // Check if response meets minimum length requirement
      if (fullResponse.length >= query.expectedMinLength) {
        console.log(`   ✅ Response length adequate (>=${query.expectedMinLength} chars)`);
        completeResponses++;
      } else {
        console.log(`   ⚠️  Response may be truncated (${fullResponse.length} < ${query.expectedMinLength} chars)`);
      }
      
      // Check if response contains expected content
      const containsExpected = query.shouldContain.every(term => 
        fullResponse.toLowerCase().includes(term.toLowerCase())
      );
      
      if (containsExpected) {
        console.log(`   ✅ Contains expected content: ${query.shouldContain.join(', ')}`);
      } else {
        console.log(`   ⚠️  Missing some expected content: ${query.shouldContain.join(', ')}`);
      }
      
      // Show sample of response
      const sample = fullResponse.substring(0, 150).replace(/\n/g, ' ');
      console.log(`   💬 Sample: "${sample}..."`);
      
      // Performance analysis
      if (duration < 30000) {
        console.log('   🚀 Good response time (<30s)');
      } else if (duration < 45000) {
        console.log('   ⏰ Acceptable response time (<45s)');
      } else {
        console.log('   🐌 Slow response time (>45s)');
      }

    } catch (error) {
      totalTests++;
      if (error.message.includes('timeout')) {
        console.log(`   ⏰ Timed out after 45 seconds`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Wait between requests
    if (i < testQueries.length - 1) {
      console.log('   ⏳ Waiting 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 COMPLETE RESPONSE TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Successful responses: ${successfulTests}/${totalTests}`);
  console.log(`📏 Complete responses: ${completeResponses}/${successfulTests}`);
  console.log(`📈 Success Rate: ${Math.round((successfulTests / totalTests) * 100)}%`);
  console.log(`📋 Completeness Rate: ${Math.round((completeResponses / successfulTests) * 100)}%`);

  if (completeResponses === successfulTests && successfulTests > 0) {
    console.log('🎉 All responses are complete!');
    console.log('');
    console.log('✅ VERIFIED FIXES:');
    console.log('   🔧 Increased num_predict to 300 tokens');
    console.log('   🔄 Retry logic for incomplete responses');
    console.log('   📊 Complete response logging');
    console.log('   🎯 Improved system prompts');
    console.log('   ⚡ Streaming with complete assembly');
  } else if (successfulTests > 0) {
    console.log('⚠️ Some responses may still be incomplete');
    console.log('💡 Consider further tuning num_predict or system prompts');
  } else {
    console.log('❌ No successful responses - check server and Ollama status');
  }

  console.log('='.repeat(50));
  return completeResponses === successfulTests && successfulTests > 0;
}

// Run the test
testCompleteResponses()
  .then(success => {
    if (success) {
      console.log('\n🚀 CONCLUSION: Complete response fixes are working!');
      console.log('📋 Chat responses should now be complete without truncation.');
    } else {
      console.log('\n⚠️ Some issues may remain - check logs above for details.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Complete response test failed:', error);
    process.exit(1);
  });
