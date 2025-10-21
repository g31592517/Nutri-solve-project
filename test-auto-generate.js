#!/usr/bin/env node

/**
 * Automated Test Script for Auto-Generate Plan Feature
 * Tests the complete workflow from user auth to meal plan generation
 */

import fetch from 'node-fetch';
import fs from 'fs';

const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:8080';

// Test configuration
const TEST_USER = {
  email: 'ippsec@test.com',
  username: 'Ippsec',
  password: 'testpass123'
};

const TEST_PROFILE = {
  age: 28,
  gender: 'male',
  weight: 75,
  activityLevel: 'moderate',
  primaryGoal: 'weight_loss',
  dietaryRestrictions: ['vegan'],
  weeklyBudget: '50-100'
};

let authToken = null;
let testResults = [];

// Utility functions
function logTest(testName, status, details = '') {
  const result = {
    test: testName,
    status: status,
    details: details,
    timestamp: new Date().toISOString()
  };
  testResults.push(result);
  console.log(`[${status.toUpperCase()}] ${testName}${details ? ': ' + details : ''}`);
}

async function makeRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json();
  return { response, data };
}

// Test 1: Server Health Check
async function testServerHealth() {
  try {
    const { response } = await fetch(`${API_BASE}/health`).catch(() => ({ ok: false }));
    if (response && response.ok) {
      logTest('Server Health Check', 'PASS', 'Backend server is running');
      return true;
    } else {
      logTest('Server Health Check', 'FAIL', 'Backend server not responding');
      return false;
    }
  } catch (error) {
    logTest('Server Health Check', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test 2: User Authentication
async function testAuthentication() {
  try {
    // Try to signup (might fail if user exists, that's ok)
    await makeRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(TEST_USER)
    });

    // Login
    const { response, data } = await makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });

    if (response.ok && data.token) {
      authToken = data.token;
      logTest('User Authentication', 'PASS', `Logged in as ${TEST_USER.username}`);
      return true;
    } else {
      logTest('User Authentication', 'FAIL', data.error || 'Login failed');
      return false;
    }
  } catch (error) {
    logTest('User Authentication', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test 3: Meal Plan Generation
async function testMealPlanGeneration() {
  try {
    const requestBody = {
      profile: TEST_PROFILE,
      budget: '50-100',
      preferences: 'prefer light dinners, avoid nuts',
      varietyMode: 'variety'
    };

    console.log('\n🤖 Testing Ollama meal plan generation...');
    console.log('Request payload:', JSON.stringify(requestBody, null, 2));

    const startTime = Date.now();
    const { response, data } = await makeRequest('/meal-plan/generate', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });
    const duration = Date.now() - startTime;

    console.log(`⏱️  Generation took ${duration}ms`);

    if (!response.ok) {
      logTest('Meal Plan Generation', 'FAIL', `HTTP ${response.status}: ${data.error}`);
      return false;
    }

    if (!data.success) {
      logTest('Meal Plan Generation', 'FAIL', data.error || 'Generation failed');
      return false;
    }

    if (!data.mealPlan) {
      logTest('Meal Plan Generation', 'FAIL', 'No meal plan in response');
      return false;
    }

    // Validate meal plan structure
    const plan = data.mealPlan;
    
    // Check days array
    if (!plan.days || !Array.isArray(plan.days) || plan.days.length !== 7) {
      logTest('Meal Plan Generation', 'FAIL', `Invalid days array: ${plan.days?.length || 0} days`);
      return false;
    }

    // Check each day has required meals
    const requiredMealTypes = ['breakfast', 'lunch', 'dinner'];
    let totalMeals = 0;
    let totalCalories = 0;
    let totalProtein = 0;

    for (const day of plan.days) {
      if (!day.day || !day.meals || !Array.isArray(day.meals)) {
        logTest('Meal Plan Generation', 'FAIL', `Invalid day structure: ${day.day}`);
        return false;
      }

      // Check required meals exist
      for (const mealType of requiredMealTypes) {
        const meal = day.meals.find(m => m.type === mealType);
        if (!meal) {
          logTest('Meal Plan Generation', 'FAIL', `Missing ${mealType} for ${day.day}`);
          return false;
        }

        // Validate meal structure
        if (!meal.name || typeof meal.calories !== 'number' || typeof meal.protein !== 'number') {
          logTest('Meal Plan Generation', 'FAIL', `Invalid meal structure: ${meal.name}`);
          return false;
        }

        // Check dietary restrictions
        if (TEST_PROFILE.dietaryRestrictions.includes('vegan')) {
          const mealText = `${meal.name} ${meal.ingredients?.join(' ') || ''}`.toLowerCase();
          const nonVeganItems = ['chicken', 'beef', 'pork', 'fish', 'cheese', 'milk', 'egg'];
          const hasNonVegan = nonVeganItems.some(item => mealText.includes(item));
          if (hasNonVegan) {
            logTest('Meal Plan Generation', 'WARN', `Potential non-vegan meal: ${meal.name}`);
          }
        }

        totalMeals++;
        totalCalories += meal.calories;
        totalProtein += meal.protein;
      }
    }

    // Check weekly totals
    if (!plan.weeklyTotals) {
      logTest('Meal Plan Generation', 'FAIL', 'Missing weekly totals');
      return false;
    }

    // Validate calorie targets for weight loss
    const avgDailyCalories = totalCalories / 7;
    if (TEST_PROFILE.primaryGoal === 'weight_loss' && avgDailyCalories > 2200) {
      logTest('Meal Plan Generation', 'WARN', `High calories for weight loss: ${Math.round(avgDailyCalories)}/day`);
    }

    logTest('Meal Plan Generation', 'PASS', 
      `Generated 7-day plan: ${totalMeals} meals, avg ${Math.round(avgDailyCalories)} kcal/day, ${Math.round(totalProtein/7)}g protein/day`);

    // Save the generated plan for inspection
    fs.writeFileSync('/tmp/generated-meal-plan.json', JSON.stringify(plan, null, 2));
    console.log('📁 Meal plan saved to /tmp/generated-meal-plan.json');

    return true;
  } catch (error) {
    logTest('Meal Plan Generation', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test 4: Meal Swap Functionality
async function testMealSwap() {
  try {
    const requestBody = {
      mealName: 'Vegan Breakfast Bowl',
      mealType: 'breakfast',
      day: 'Monday',
      profile: TEST_PROFILE,
      budget: '50-100',
      preferences: 'quick breakfast options'
    };

    const { response, data } = await makeRequest('/meal-plan/swap', {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      logTest('Meal Swap', 'FAIL', `HTTP ${response.status}: ${data.error}`);
      return false;
    }

    if (!data.success || !data.alternatives || !Array.isArray(data.alternatives)) {
      logTest('Meal Swap', 'FAIL', 'Invalid swap response structure');
      return false;
    }

    if (data.alternatives.length === 0) {
      logTest('Meal Swap', 'FAIL', 'No alternatives provided');
      return false;
    }

    // Validate alternatives structure
    for (const alt of data.alternatives) {
      if (!alt.name || typeof alt.calories !== 'number' || !alt.ingredients) {
        logTest('Meal Swap', 'FAIL', `Invalid alternative structure: ${alt.name}`);
        return false;
      }
    }

    logTest('Meal Swap', 'PASS', `Generated ${data.alternatives.length} alternatives`);
    return true;
  } catch (error) {
    logTest('Meal Swap', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test 5: Preference Extraction
async function testPreferenceExtraction() {
  try {
    const testText = "I love pasta and Mediterranean food. I avoid dairy and nuts. I prefer light dinners and quick breakfasts.";
    
    const { response, data } = await makeRequest('/meal-plan/extract-preferences', {
      method: 'POST',
      body: JSON.stringify({ text: testText })
    });

    if (!response.ok) {
      logTest('Preference Extraction', 'FAIL', `HTTP ${response.status}: ${data.error}`);
      return false;
    }

    if (!data.success || !data.extracted) {
      logTest('Preference Extraction', 'FAIL', 'Invalid extraction response');
      return false;
    }

    const extracted = data.extracted;
    if (!extracted.preferences || !extracted.avoids || !extracted.requests) {
      logTest('Preference Extraction', 'FAIL', 'Missing extraction categories');
      return false;
    }

    logTest('Preference Extraction', 'PASS', 
      `Extracted: ${extracted.preferences.length} preferences, ${extracted.avoids.length} avoids, ${extracted.requests.length} requests`);
    return true;
  } catch (error) {
    logTest('Preference Extraction', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Test 6: Edge Cases
async function testEdgeCases() {
  try {
    // Test with empty profile
    let { response, data } = await makeRequest('/meal-plan/generate', {
      method: 'POST',
      body: JSON.stringify({})
    });

    if (response.ok) {
      logTest('Edge Case - Empty Profile', 'FAIL', 'Should reject empty profile');
      return false;
    }

    // Test with invalid dietary restrictions
    const invalidProfile = {
      ...TEST_PROFILE,
      dietaryRestrictions: ['vegan', 'nut_allergy', 'gluten_free']
    };

    ({ response, data } = await makeRequest('/meal-plan/generate', {
      method: 'POST',
      body: JSON.stringify({
        profile: invalidProfile,
        budget: '50-100',
        preferences: 'avoid all nuts and gluten',
        varietyMode: 'variety'
      })
    }));

    if (!response.ok) {
      logTest('Edge Case - Multiple Restrictions', 'FAIL', 'Should handle multiple restrictions');
      return false;
    }

    logTest('Edge Case Testing', 'PASS', 'Handled edge cases appropriately');
    return true;
  } catch (error) {
    logTest('Edge Case Testing', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 Starting Auto-Generate Plan Feature Tests\n');
  console.log('=' .repeat(60));

  const tests = [
    { name: 'Server Health', fn: testServerHealth },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Meal Plan Generation', fn: testMealPlanGeneration },
    { name: 'Meal Swap', fn: testMealSwap },
    { name: 'Preference Extraction', fn: testPreferenceExtraction },
    { name: 'Edge Cases', fn: testEdgeCases }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n🔍 Running: ${test.name}`);
    console.log('-'.repeat(40));
    
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test ${test.name} threw error:`, error.message);
      failed++;
    }
  }

  // Generate test report
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  // Save detailed results
  const report = {
    summary: {
      total: passed + failed,
      passed,
      failed,
      successRate: Math.round((passed / (passed + failed)) * 100)
    },
    results: testResults,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync('/tmp/test-report.json', JSON.stringify(report, null, 2));
  console.log('\n📁 Detailed report saved to /tmp/test-report.json');

  return passed === tests.length;
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

export { runAllTests };
