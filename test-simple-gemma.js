// Simple test to verify Gemma is working
console.log('🧪 Testing Simple Gemma Generation');

async function testSimpleGeneration() {
  try {
    console.log('📡 Testing regular meal plan endpoint...');
    
    const response = await fetch('http://localhost:5000/api/meal-plan/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profile: {
          age: 30,
          gender: 'male',
          weight: 75,
          activityLevel: 'moderate',
          primaryGoal: 'weight_loss',
          dietaryRestrictions: ['vegan']
        },
        budget: '50-100',
        preferences: 'light dinners',
        varietyMode: 'variety'
      })
    });

    console.log(`📊 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP Error: ${response.status} - ${errorText}`);
      return;
    }

    const data = await response.json();
    console.log('✅ Response received!');
    console.log(`📋 Success: ${data.success}`);
    
    if (data.success && data.mealPlan) {
      console.log(`🎯 Days generated: ${data.mealPlan.days.length}`);
      console.log(`📊 First day: ${data.mealPlan.days[0]?.day}`);
      console.log(`🍽️  First meal: ${data.mealPlan.days[0]?.meals[0]?.name}`);
      console.log('✅ Real Gemma generation working!');
    } else {
      console.log(`❌ Generation failed: ${data.error}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleGeneration();
