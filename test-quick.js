// Quick test script for API endpoints
const API_URL = 'http://localhost:5000/api';

async function testChatAPI() {
  console.log('Testing Chat API...');
  
  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Hi', 
        stream: false 
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Chat API Response:', data);
    return true;
  } catch (error) {
    console.error('❌ Chat API Error:', error.message);
    return false;
  }
}

async function testMealPlanAPI() {
  console.log('\nTesting Meal Plan API...');
  
  const testProfile = {
    age: 25,
    gender: 'male',
    weight: 70,
    primaryGoal: 'maintenance',
    activityLevel: 'moderate',
    dietaryRestrictions: []
  };

  try {
    const response = await fetch(`${API_URL}/meal-plan/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        profile: testProfile,
        budget: '50-100',
        preferences: 'healthy meals',
        varietyMode: 'variety'
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Meal Plan API Response:', data.success ? 'Success' : 'Failed');
    return true;
  } catch (error) {
    console.error('❌ Meal Plan API Error:', error.message);
    return false;
  }
}

async function testHealthCheck() {
  console.log('Testing Health Check...');
  
  try {
    const response = await fetch(`http://localhost:5000/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data);
    return true;
  } catch (error) {
    console.error('❌ Health Check Error:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('❌ Backend server is not responding properly');
    return;
  }

  // Test with 10 minute timeout for chat
  console.log('\n⏱️  Testing Chat API (with 10 minute timeout)...');
  const chatPromise = testChatAPI();
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('10 minute timeout')), 600000)
  );
  
  try {
    await Promise.race([chatPromise, timeoutPromise]);
  } catch (error) {
    console.log('❌ Chat API timed out or failed:', error.message);
  }

  // Test meal plan with 10 minute timeout
  console.log('\n⏱️  Testing Meal Plan API (with 10 minute timeout)...');
  const mealPromise = testMealPlanAPI();
  const mealTimeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('10 minute timeout')), 600000)
  );
  
  try {
    await Promise.race([mealPromise, mealTimeoutPromise]);
  } catch (error) {
    console.log('❌ Meal Plan API timed out or failed:', error.message);
  }

  console.log('\n🏁 Tests completed');
}

runTests().catch(console.error);
