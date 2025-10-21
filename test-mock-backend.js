#!/usr/bin/env node

/**
 * Mock Backend Server for Testing Auto-Generate Plan
 * This creates a temporary mock server to test the frontend functionality
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5001; // Different port to avoid conflicts

app.use(cors());
app.use(express.json());

// Mock meal plan data
const generateMockMealPlan = (profile, budget, preferences, varietyMode) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  const veganMeals = {
    breakfast: [
      { name: 'Vegan Oatmeal Bowl', calories: 320, protein: 12, carbs: 58, fat: 8, ingredients: ['oats', 'almond milk', 'berries', 'chia seeds'] },
      { name: 'Tofu Scramble', calories: 280, protein: 18, carbs: 12, fat: 16, ingredients: ['tofu', 'spinach', 'nutritional yeast', 'turmeric'] },
      { name: 'Smoothie Bowl', calories: 350, protein: 15, carbs: 65, fat: 9, ingredients: ['banana', 'spinach', 'protein powder', 'coconut'] }
    ],
    lunch: [
      { name: 'Quinoa Buddha Bowl', calories: 450, protein: 18, carbs: 68, fat: 14, ingredients: ['quinoa', 'chickpeas', 'avocado', 'kale'] },
      { name: 'Lentil Soup', calories: 380, protein: 22, carbs: 55, fat: 8, ingredients: ['red lentils', 'vegetables', 'coconut milk', 'spices'] },
      { name: 'Veggie Wrap', calories: 420, protein: 16, carbs: 58, fat: 15, ingredients: ['whole wheat tortilla', 'hummus', 'vegetables', 'sprouts'] }
    ],
    dinner: [
      { name: 'Vegan Stir Fry', calories: 380, protein: 20, carbs: 45, fat: 12, ingredients: ['tofu', 'broccoli', 'bell peppers', 'brown rice'] },
      { name: 'Chickpea Curry', calories: 420, protein: 18, carbs: 52, fat: 16, ingredients: ['chickpeas', 'coconut milk', 'tomatoes', 'spices'] },
      { name: 'Stuffed Bell Peppers', calories: 350, protein: 15, carbs: 48, fat: 12, ingredients: ['bell peppers', 'quinoa', 'black beans', 'vegetables'] }
    ],
    snack: [
      { name: 'Mixed Nuts', calories: 180, protein: 6, carbs: 8, fat: 16, ingredients: ['almonds', 'walnuts', 'cashews'] },
      { name: 'Apple with Almond Butter', calories: 200, protein: 6, carbs: 22, fat: 12, ingredients: ['apple', 'almond butter'] },
      { name: 'Hummus with Veggies', calories: 150, protein: 8, carbs: 18, fat: 6, ingredients: ['hummus', 'carrots', 'cucumber', 'bell peppers'] }
    ]
  };

  const planDays = days.map(day => {
    const meals = mealTypes.map(type => {
      const mealOptions = veganMeals[type];
      const meal = mealOptions[Math.floor(Math.random() * mealOptions.length)];
      return {
        type,
        ...meal,
        cost: Math.round((meal.calories * 0.01 + Math.random() * 2) * 100) / 100
      };
    });

    const dayTotals = meals.reduce((acc, meal) => ({
      totalCalories: acc.totalCalories + meal.calories,
      totalProtein: acc.totalProtein + meal.protein,
      totalCarbs: acc.totalCarbs + meal.carbs,
      totalFat: acc.totalFat + meal.fat
    }), { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });

    return {
      day,
      meals,
      ...dayTotals
    };
  });

  const weeklyTotals = planDays.reduce((acc, day) => ({
    calories: acc.calories + day.totalCalories,
    protein: acc.protein + day.totalProtein,
    carbs: acc.carbs + day.totalCarbs,
    fat: acc.fat + day.totalFat,
    estimatedCost: acc.estimatedCost + day.meals.reduce((sum, m) => sum + (m.cost || 0), 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0, estimatedCost: 0 });

  return {
    days: planDays,
    weeklyTotals,
    metadata: {
      createdAt: new Date().toISOString(),
      generationType: 'mock',
      userGoal: profile.primaryGoal,
      budget,
      preferences
    }
  };
};

// Mock endpoints
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mock NutriSolve API is running',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/meal-plan/generate', (req, res) => {
  console.log('📥 Received meal plan generation request');
  console.log('Profile:', req.body.profile);
  console.log('Budget:', req.body.budget);
  console.log('Preferences:', req.body.preferences);

  // Simulate processing time
  setTimeout(() => {
    const mealPlan = generateMockMealPlan(
      req.body.profile,
      req.body.budget,
      req.body.preferences,
      req.body.varietyMode
    );

    console.log('✅ Generated mock meal plan');
    res.json({
      success: true,
      mealPlan
    });
  }, 1000); // 1 second delay to simulate processing
});

app.post('/api/meal-plan/swap', (req, res) => {
  console.log('📥 Received meal swap request for:', req.body.mealName);

  setTimeout(() => {
    const alternatives = [
      {
        name: 'Alternative Vegan Bowl',
        calories: 340,
        protein: 16,
        carbs: 45,
        fat: 12,
        ingredients: ['quinoa', 'black beans', 'avocado', 'salsa'],
        reason: 'Higher protein alternative with similar calories'
      },
      {
        name: 'Green Smoothie',
        calories: 280,
        protein: 12,
        carbs: 38,
        fat: 8,
        ingredients: ['spinach', 'banana', 'protein powder', 'almond milk'],
        reason: 'Lighter option with quick preparation'
      },
      {
        name: 'Chia Pudding',
        calories: 320,
        protein: 14,
        carbs: 35,
        fat: 15,
        ingredients: ['chia seeds', 'coconut milk', 'berries', 'maple syrup'],
        reason: 'Make-ahead option with omega-3s'
      }
    ];

    res.json({
      success: true,
      alternatives
    });
  }, 500);
});

app.post('/api/meal-plan/extract-preferences', (req, res) => {
  console.log('📥 Received preference extraction request');

  setTimeout(() => {
    res.json({
      success: true,
      extracted: {
        preferences: ['pasta', 'Mediterranean cuisine'],
        avoids: ['dairy', 'nuts'],
        requests: ['light dinners', 'quick breakfasts']
      }
    });
  }, 300);
});

// Start mock server
app.listen(PORT, () => {
  console.log(`🎭 Mock NutriSolve API running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  GET  /health');
  console.log('  POST /api/meal-plan/generate');
  console.log('  POST /api/meal-plan/swap');
  console.log('  POST /api/meal-plan/extract-preferences');
  console.log('\n🧪 Ready for testing!');
});

export default app;
