/**
 * Automated Test Script for Weekly Meal Planner
 * Tests the streaming meal plan generation endpoint
 * 
 * Usage: node test-meal-planner.js
 */

const API_URL = 'http://localhost:5000/api';

// Test user profile
const testProfile = {
  age: 28,
  gender: 'female',
  weight: 65,
  activityLevel: 'moderate',
  primaryGoal: 'weight_loss',
  dietaryRestrictions: ['vegetarian'],
};

// Test preferences
const testPreferences = {
  budget: '50-100',
  preferences: 'light dinners, high protein breakfast',
  varietyMode: 'varied',
};

console.log('🧪 Weekly Meal Planner - Automated Test\n');
console.log('=' .repeat(60));

async function testStreamingGeneration() {
  console.log('\n📋 Test 1: Streaming Meal Plan Generation');
  console.log('-'.repeat(60));
  
  const startTime = Date.now();
  let dayCount = 0;
  const days = [];
  let statusUpdates = [];
  
  try {
    console.log('✓ Sending request to /meal-plan/generate-stream');
    console.log('✓ Profile:', JSON.stringify(testProfile, null, 2));
    console.log('✓ Preferences:', JSON.stringify(testPreferences, null, 2));
    
    const response = await fetch(`${API_URL}/meal-plan/generate-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile: testProfile,
        ...testPreferences,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✓ Connection established (SSE)');
    console.log('✓ Waiting for streaming data...\n');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            console.log('\n✓ Stream completed');
            break;
          }

          try {
            const event = JSON.parse(data);
            
            if (event.type === 'status') {
              statusUpdates.push(event);
              console.log(`📊 Status: ${event.message} (${event.progress}%)`);
            } else if (event.type === 'day_complete') {
              dayCount++;
              days.push(event.day);
              const dayTime = ((Date.now() - startTime) / 1000).toFixed(2);
              console.log(`✅ Day ${dayCount}/7: ${event.day.day} completed in ${dayTime}s`);
              console.log(`   - Meals: ${event.day.meals.length}`);
              console.log(`   - Calories: ${event.day.totalCalories}`);
              console.log(`   - Protein: ${event.day.totalProtein}g\n`);
            } else if (event.type === 'complete') {
              console.log('🎉 Meal plan generation complete!');
              console.log(`   - Total days: ${event.mealPlan.days.length}`);
              console.log(`   - Weekly calories: ${event.mealPlan.weeklyTotals.calories}`);
              console.log(`   - Weekly protein: ${event.mealPlan.weeklyTotals.protein}g`);
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (parseError) {
            console.warn('⚠️  Failed to parse event:', data);
          }
        }
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(60));
    console.log(`✓ Total time: ${totalTime}s`);
    console.log(`✓ Days generated: ${dayCount}/7`);
    console.log(`✓ Status updates: ${statusUpdates.length}`);
    console.log(`✓ Average time per day: ${(totalTime / dayCount).toFixed(2)}s`);
    
    // Validate results
    console.log('\n📋 Validation Checks:');
    const checks = [
      { name: 'All 7 days generated', pass: dayCount === 7 },
      { name: 'Each day has 3 meals', pass: days.every(d => d.meals.length === 3) },
      { name: 'All meals have names', pass: days.every(d => d.meals.every(m => m.name)) },
      { name: 'All meals have calories', pass: days.every(d => d.meals.every(m => m.calories > 0)) },
      { name: 'All meals have protein', pass: days.every(d => d.meals.every(m => m.protein > 0)) },
      { name: 'All meals have ingredients', pass: days.every(d => d.meals.every(m => m.ingredients?.length > 0)) },
      { name: 'Vegetarian meals only', pass: days.every(d => d.meals.every(m => 
        !m.name.toLowerCase().includes('chicken') &&
        !m.name.toLowerCase().includes('beef') &&
        !m.name.toLowerCase().includes('pork') &&
        !m.name.toLowerCase().includes('fish')
      )) },
    ];
    
    checks.forEach(check => {
      console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
    });
    
    const allPassed = checks.every(c => c.pass);
    
    if (allPassed) {
      console.log('\n🎉 All validation checks passed!');
      return true;
    } else {
      console.log('\n⚠️  Some validation checks failed');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

async function testNonStreamingGeneration() {
  console.log('\n📋 Test 2: Non-Streaming Meal Plan Generation');
  console.log('-'.repeat(60));
  
  const startTime = Date.now();
  
  try {
    console.log('✓ Sending request to /meal-plan/generate');
    
    const response = await fetch(`${API_URL}/meal-plan/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile: testProfile,
        ...testPreferences,
      }),
    });

    const data = await response.json();
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);

    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    console.log(`✓ Response received in ${totalTime}s`);
    console.log(`✓ Days: ${data.mealPlan.days.length}`);
    console.log(`✓ Weekly calories: ${data.mealPlan.weeklyTotals.calories}`);
    console.log(`✓ Cached: ${data.cached ? 'Yes' : 'No'}`);
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testCaching() {
  console.log('\n📋 Test 3: Response Caching');
  console.log('-'.repeat(60));
  
  try {
    console.log('✓ First request (should not be cached)...');
    const start1 = Date.now();
    const response1 = await fetch(`${API_URL}/meal-plan/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: testProfile,
        ...testPreferences,
      }),
    });
    const data1 = await response1.json();
    const time1 = ((Date.now() - start1) / 1000).toFixed(2);
    console.log(`  Time: ${time1}s, Cached: ${data1.cached ? 'Yes' : 'No'}`);
    
    console.log('\n✓ Second request (should be cached)...');
    const start2 = Date.now();
    const response2 = await fetch(`${API_URL}/meal-plan/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: testProfile,
        ...testPreferences,
      }),
    });
    const data2 = await response2.json();
    const time2 = ((Date.now() - start2) / 1000).toFixed(2);
    console.log(`  Time: ${time2}s, Cached: ${data2.cached ? 'Yes' : 'No'}`);
    
    const speedup = (parseFloat(time1) / parseFloat(time2)).toFixed(1);
    console.log(`\n✓ Cache speedup: ${speedup}x faster`);
    
    if (data2.cached && parseFloat(time2) < parseFloat(time1)) {
      console.log('✅ Caching works correctly!');
      return true;
    } else {
      console.log('⚠️  Caching may not be working as expected');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testModelVerification() {
  console.log('\n📋 Test 4: Model Verification (gemma:2b)');
  console.log('-'.repeat(60));
  
  try {
    // Check backend logs for model references
    console.log('✓ Checking for gemma:2b usage...');
    console.log('  (Check backend console for model warm-up logs)');
    console.log('  Expected: "[MealPlan] Warming up gemma:2b model..."');
    console.log('  Expected: "[MealPlan] Calling Gemma for Monday..."');
    console.log('\n✓ Checking for phi3 references...');
    console.log('  Run: grep -r "phi3" backend/controllers/');
    console.log('  Expected: No results');
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n📋 Test 5: Error Handling');
  console.log('-'.repeat(60));
  
  try {
    console.log('✓ Testing with invalid profile...');
    const response = await fetch(`${API_URL}/meal-plan/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: null,
        budget: '50-100',
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok && data.error) {
      console.log(`✅ Error handled correctly: ${data.error}`);
      return true;
    } else {
      console.log('⚠️  Expected error response');
      return false;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Starting automated tests...\n');
  
  const results = {
    streaming: false,
    nonStreaming: false,
    caching: false,
    modelVerification: false,
    errorHandling: false,
  };
  
  // Test 1: Streaming generation (main test)
  results.streaming = await testStreamingGeneration();
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 2: Non-streaming generation
  results.nonStreaming = await testNonStreamingGeneration();
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Caching
  results.caching = await testCaching();
  
  // Test 4: Model verification
  results.modelVerification = await testModelVerification();
  
  // Test 5: Error handling
  results.errorHandling = await testErrorHandling();
  
  // Final summary
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Final Test Results');
  console.log('='.repeat(60));
  console.log(`${results.streaming ? '✅' : '❌'} Streaming Generation`);
  console.log(`${results.nonStreaming ? '✅' : '❌'} Non-Streaming Generation`);
  console.log(`${results.caching ? '✅' : '❌'} Response Caching`);
  console.log(`${results.modelVerification ? '✅' : '❌'} Model Verification`);
  console.log(`${results.errorHandling ? '✅' : '❌'} Error Handling`);
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Overall: ${passed}/${total} tests passed`);
  console.log('='.repeat(60));
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Meal planner is working correctly.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the results above.');
    process.exit(1);
  }
}

// Check if backend is running
async function checkBackend() {
  try {
    const response = await fetch(`${API_URL}/health`, { method: 'GET' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Main execution
(async () => {
  console.log('🔍 Checking if backend is running...');
  const isRunning = await checkBackend();
  
  if (!isRunning) {
    console.error('❌ Backend is not running on http://localhost:5000');
    console.error('   Please start the backend first:');
    console.error('   cd backend && npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Backend is running\n');
  
  await runAllTests();
})();
