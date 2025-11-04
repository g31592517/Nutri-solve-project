/**
 * Simple Test for Meal Planner Streaming
 */

const API_URL = 'http://localhost:5000/api';

const testProfile = {
  age: 28,
  gender: 'female',
  weight: 65,
  activityLevel: 'moderate',
  primaryGoal: 'weight_loss',
  dietaryRestrictions: ['vegetarian'],
};

console.log('🧪 Testing Weekly Meal Planner Streaming\n');
console.log('Profile:', testProfile);
console.log('\nStarting generation...\n');

async function testStreaming() {
  const startTime = Date.now();
  let dayCount = 0;

  try {
    const response = await fetch(`${API_URL}/meal-plan/generate-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: testProfile,
        budget: '50-100',
        preferences: 'light dinners, high protein breakfast',
        varietyMode: 'varied',
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    console.log('✅ Connection established\n');

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
            console.log('\n✅ Stream completed');
            break;
          }

          try {
            const event = JSON.parse(data);
            
            if (event.type === 'status') {
              console.log(`📊 ${event.message} (${event.progress}%)`);
            } else if (event.type === 'day_complete') {
              dayCount++;
              const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
              console.log(`✅ ${event.day.day} completed in ${elapsed}s`);
              console.log(`   Meals: ${event.day.meals.length}, Calories: ${event.day.totalCalories}, Protein: ${event.day.totalProtein}g`);
            } else if (event.type === 'complete') {
              console.log('\n🎉 Generation complete!');
              console.log(`   Days: ${event.mealPlan.days.length}`);
              console.log(`   Weekly Calories: ${event.mealPlan.weeklyTotals.calories}`);
              console.log(`   Weekly Protein: ${event.mealPlan.weeklyTotals.protein}g`);
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch (e) {
            // Skip parse errors
          }
        }
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Total time: ${totalTime}s`);
    console.log(`📊 Days generated: ${dayCount}/7`);
    console.log(`⚡ Avg per day: ${(totalTime / dayCount).toFixed(2)}s`);
    
    if (dayCount === 7) {
      console.log('\n✅ TEST PASSED - All 7 days generated successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ TEST FAILED - Not all days generated');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

testStreaming();
