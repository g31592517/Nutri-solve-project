#!/usr/bin/env node

/**
 * Simple Direct API Test for Meal Plan Generation
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000';

async function testHealthCheck() {
  console.log('🏥 Testing health check...');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    console.log('✅ Health check:', data.message);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testMealPlanGeneration() {
  console.log('\n🍽️ Testing meal plan generation...');
  
  const testProfile = {
    age: 28,
    gender: 'male',
    weight: 75,
    activityLevel: 'moderate',
    primaryGoal: 'weight_loss',
    dietaryRestrictions: ['vegan'],
    weeklyBudget: '50-100'
  };

  const requestBody = {
    profile: testProfile,
    budget: '50-100',
    preferences: 'prefer light dinners',
    varietyMode: 'variety'
  };

  console.log('📤 Sending request to /api/meal-plan/generate');
  console.log('Profile:', JSON.stringify(testProfile, null, 2));

  try {
    const startTime = Date.now();
    
    const response = await fetch(`${API_BASE}/api/meal-plan/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      // Increase timeout for Ollama
      timeout: 120000 // 2 minutes
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️ Request took ${duration}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ HTTP ${response.status}:`, errorText);
      return false;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.log('❌ API returned error:', data.error);
      return false;
    }

    if (!data.mealPlan) {
      console.log('❌ No meal plan in response');
      return false;
    }

    const plan = data.mealPlan;
    console.log('✅ Meal plan generated successfully!');
    console.log(`📊 Plan contains ${plan.days?.length || 0} days`);
    
    if (plan.days && plan.days.length > 0) {
      const firstDay = plan.days[0];
      console.log(`📅 First day (${firstDay.day}) has ${firstDay.meals?.length || 0} meals`);
      
      if (firstDay.meals && firstDay.meals.length > 0) {
        console.log('🥗 Sample meals:');
        firstDay.meals.forEach(meal => {
          console.log(`  - ${meal.type}: ${meal.name} (${meal.calories} kcal, ${meal.protein}g protein)`);
        });
      }
    }

    if (plan.weeklyTotals) {
      const avgCalories = Math.round(plan.weeklyTotals.calories / 7);
      const avgProtein = Math.round(plan.weeklyTotals.protein / 7);
      console.log(`📈 Weekly totals: ${plan.weeklyTotals.calories} kcal, ${plan.weeklyTotals.protein}g protein`);
      console.log(`📊 Daily averages: ${avgCalories} kcal, ${avgProtein}g protein`);
    }

    // Check for vegan compliance
    let veganCompliant = true;
    const nonVeganItems = ['chicken', 'beef', 'pork', 'fish', 'cheese', 'milk', 'egg', 'butter'];
    
    if (plan.days) {
      for (const day of plan.days) {
        if (day.meals) {
          for (const meal of day.meals) {
            const mealText = `${meal.name} ${meal.ingredients?.join(' ') || ''}`.toLowerCase();
            const hasNonVegan = nonVeganItems.some(item => mealText.includes(item));
            if (hasNonVegan) {
              console.log(`⚠️ Potential non-vegan meal: ${meal.name} on ${day.day}`);
              veganCompliant = false;
            }
          }
        }
      }
    }

    if (veganCompliant) {
      console.log('✅ All meals appear to be vegan-compliant');
    }

    return true;
  } catch (error) {
    console.log('❌ Request failed:', error.message);
    return false;
  }
}

async function testMealSwap() {
  console.log('\n🔄 Testing meal swap...');
  
  const requestBody = {
    mealName: 'Vegan Breakfast Bowl',
    mealType: 'breakfast',
    day: 'Monday',
    profile: {
      primaryGoal: 'weight_loss',
      dietaryRestrictions: ['vegan']
    },
    budget: '50-100',
    preferences: 'quick breakfast options'
  };

  try {
    const response = await fetch(`${API_BASE}/api/meal-plan/swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      timeout: 30000 // 30 seconds
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ HTTP ${response.status}:`, errorText);
      return false;
    }

    const data = await response.json();
    
    if (!data.success) {
      console.log('❌ Swap failed:', data.error);
      return false;
    }

    if (!data.alternatives || data.alternatives.length === 0) {
      console.log('❌ No alternatives provided');
      return false;
    }

    console.log(`✅ Generated ${data.alternatives.length} alternatives:`);
    data.alternatives.forEach((alt, index) => {
      console.log(`  ${index + 1}. ${alt.name} (${alt.calories} kcal, ${alt.protein}g protein)`);
      if (alt.reason) {
        console.log(`     Reason: ${alt.reason}`);
      }
    });

    return true;
  } catch (error) {
    console.log('❌ Swap request failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Running Simple API Tests');
  console.log('=' .repeat(50));

  const results = [];
  
  // Test 1: Health Check
  results.push(await testHealthCheck());
  
  // Test 2: Meal Plan Generation
  results.push(await testMealPlanGeneration());
  
  // Test 3: Meal Swap
  results.push(await testMealSwap());

  const passed = results.filter(r => r).length;
  const total = results.length;

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);

  if (passed === total) {
    console.log('🎉 All tests passed! Auto-Generate Plan is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the output above for details.');
  }

  return passed === total;
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
