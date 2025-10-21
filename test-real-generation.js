// Test Real Gemma Generation for Ippsec Profile
// This script tests the actual API endpoints with real model responses

console.log('🧪 Testing Real Gemma Generation for Ippsec Profile');
console.log('👤 Profile: Vegan, Weight Loss, $50-100 budget, Light dinners');
console.log('');

async function testRealGeneration() {
  const startTime = Date.now();
  
  console.log('🚀 Starting real meal plan generation test...');
  console.log('📡 Calling streaming endpoint with Ippsec profile...');
  
  try {
    const response = await fetch('http://localhost:5000/api/meal-plan/generate-stream', {
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
        preferences: 'light dinners, high protein meals',
        varietyMode: 'variety'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('✅ Connection established, reading stream...');
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let dayCount = 0;
    const dayTimings = [];

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            const totalTime = Date.now() - startTime;
            console.log('');
            console.log('🎉 Real Generation Complete!');
            console.log(`⏱️  Total Time: ${Math.round(totalTime/1000)}s`);
            console.log(`📊 Average per day: ${Math.round(totalTime/dayCount/1000)}s`);
            console.log('');
            console.log('✅ Test Results:');
            console.log(`   - Real Gemma responses: ${dayCount > 0 ? 'YES ✅' : 'NO ❌'}`);
            console.log(`   - Days generated: ${dayCount}/7`);
            console.log(`   - Performance: ${totalTime < 60000 ? 'GOOD ✅' : 'SLOW ⚠️'} (${Math.round(totalTime/1000)}s)`);
            console.log(`   - No mock data: ${dayCount > 0 ? 'CONFIRMED ✅' : 'FAILED ❌'}`);
            return;
          }

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'status') {
              console.log(`📡 ${parsed.message} (${parsed.progress}%)`);
            } else if (parsed.type === 'day_complete') {
              dayCount++;
              const dayTime = Date.now() - startTime;
              dayTimings.push(dayTime);
              
              console.log(`✅ Day ${dayCount}: ${parsed.day.day} from Gemma`);
              console.log(`   - Meals: ${parsed.day.meals.length}`);
              console.log(`   - Example: ${parsed.day.meals[0]?.name || 'N/A'}`);
              console.log(`   - Calories: ${parsed.day.totalCalories || 'N/A'}`);
              console.log(`   - Protein: ${parsed.day.totalProtein || 'N/A'}g`);
              console.log(`   - Time: ${Math.round((dayTimings[dayCount-1] - (dayTimings[dayCount-2] || 0))/1000)}s`);
              console.log('');
            } else if (parsed.type === 'complete') {
              console.log('🎯 Final meal plan received from Gemma!');
              console.log(`   - Total days: ${parsed.mealPlan.days.length}`);
              console.log(`   - Weekly calories: ${parsed.mealPlan.weeklyTotals.calories}`);
              console.log(`   - Weekly protein: ${parsed.mealPlan.weeklyTotals.protein}g`);
            } else if (parsed.type === 'error') {
              console.error(`❌ Error: ${parsed.message}`);
              return;
            }
          } catch (error) {
            // Skip invalid JSON chunks
            console.log(`📝 Raw data: ${data.substring(0, 100)}...`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('🔧 Possible issues:');
    console.log('   - Backend not running on port 5000');
    console.log('   - Ollama/Gemma not responding');
    console.log('   - Network connectivity issues');
  }
}

// Run the test
testRealGeneration();
