import { Request, Response } from 'express';
import { Ollama } from 'ollama';
import Tesseract from 'tesseract.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Ollama client
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11434',
});

// Generate weekly meal plan via Ollama
export const generateMealPlan = async (req: Request, res: Response) => {
  try {
    const { profile, budget, preferences, varietyMode } = req.body;

    if (!profile) {
      return res.status(400).json({
        success: false,
        error: 'User profile is required',
      });
    }

    // Build comprehensive system prompt
    const systemPrompt = `You are a professional nutritionist and meal planning expert. Generate detailed, realistic meal plans based on user profiles and constraints. Always respond with valid JSON only, no additional text.`;

    // Build user prompt with all context
    const goalMapping: any = {
      'weight_loss': 'Weight Loss (calorie deficit, high protein)',
      'muscle_gain': 'Muscle Gain (high protein, calorie surplus)',
      'maintenance': 'Maintain Weight (balanced nutrition)',
      'general_health': 'General Health (balanced, nutrient-dense)'
    };

    const activityMapping: any = {
      'sedentary': 'Sedentary (little to no exercise)',
      'light': 'Light Activity (1-3 days/week)',
      'moderate': 'Moderate Activity (3-5 days/week)',
      'active': 'Active (6-7 days/week)',
      'very_active': 'Very Active (intense daily exercise)'
    };

    const budgetRanges: any = {
      '20-50': '$20-50 per week',
      '50-100': '$50-100 per week',
      '100-150': '$100-150 per week',
      '150+': '$150+ per week'
    };

    const goal = goalMapping[profile.primaryGoal] || 'General Health';
    const activity = activityMapping[profile.activityLevel] || 'Moderate';
    const budgetText = budgetRanges[budget] || '$50-100 per week';
    const restrictions = profile.dietaryRestrictions || [];
    const varietyText = varietyMode === 'consistent' 
      ? 'Keep meals consistent across days (meal prep friendly, some repeats allowed)'
      : 'Maximize variety with different meals each day';

    const userPrompt = `Generate a complete 7-day meal plan for the following profile:

**User Profile:**
- Age: ${profile.age || 'Not specified'}
- Gender: ${profile.gender || 'Not specified'}
- Weight: ${profile.weight || 'Not specified'}kg
- Activity Level: ${activity}
- Primary Goal: ${goal}
- Dietary Restrictions: ${restrictions.length > 0 ? restrictions.join(', ') : 'None'}

**Meal Plan Requirements:**
- Weekly Budget: ${budgetText}
- Special Preferences: ${preferences || 'None'}
- Variety Mode: ${varietyText}

**Output Format (strict JSON):**
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "type": "breakfast",
          "name": "Meal name",
          "calories": 350,
          "protein": 20,
          "carbs": 40,
          "fat": 12,
          "ingredients": ["ingredient1", "ingredient2", "..."],
          "cost": 3.50,
          "prepTime": 15
        },
        {
          "type": "lunch",
          "name": "...",
          "calories": 500,
          "protein": 35,
          "carbs": 45,
          "fat": 18,
          "ingredients": ["..."],
          "cost": 5.00,
          "prepTime": 20
        },
        {
          "type": "dinner",
          "name": "...",
          "calories": 600,
          "protein": 40,
          "carbs": 50,
          "fat": 20,
          "ingredients": ["..."],
          "cost": 7.00,
          "prepTime": 30
        },
        {
          "type": "snack",
          "name": "...",
          "calories": 150,
          "protein": 10,
          "carbs": 15,
          "fat": 5,
          "ingredients": ["..."],
          "cost": 2.00,
          "prepTime": 5
        }
      ]
    }
  ]
}

Repeat this structure for all 7 days (Monday through Sunday). Ensure:
1. Meals align with the user's goal (e.g., weight loss = lower calories, muscle gain = high protein)
2. Honor all dietary restrictions strictly
3. Stay within budget per meal
4. Include realistic ingredients and prep times
5. Provide accurate macro estimates

Generate the meal plan now in JSON format only:`;

    // Call Ollama with no timeout (user requested full response generation)
    console.log('[MealPlan] Generating meal plan via Ollama...');
    const response = await ollama.chat({
      model: process.env.OLLAMA_MODEL || 'phi3:mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: { 
        num_predict: 4000, // Allow long responses for full 7-day plan
        temperature: 0.7,
      },
    });

    const content = response?.message?.content || '';
    console.log('[MealPlan] Ollama response received, parsing JSON...');

    // Extract JSON from response (handle markdown code blocks)
    let planJson;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      planJson = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('[MealPlan] Failed to parse JSON:', parseError);
      return res.status(500).json({
        success: false,
        error: 'Failed to parse meal plan from AI response',
        rawResponse: content,
      });
    }

    // Calculate totals for each day and weekly aggregate
    const daysWithTotals = planJson.days.map((day: any) => {
      const dayTotals = day.meals.reduce(
        (acc: any, meal: any) => ({
          totalCalories: acc.totalCalories + (meal.calories || 0),
          totalProtein: acc.totalProtein + (meal.protein || 0),
          totalCarbs: acc.totalCarbs + (meal.carbs || 0),
          totalFat: acc.totalFat + (meal.fat || 0),
        }),
        { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
      );

      return {
        ...day,
        ...dayTotals,
      };
    });

    const weeklyTotals = daysWithTotals.reduce(
      (acc: any, day: any) => ({
        calories: acc.calories + day.totalCalories,
        protein: acc.protein + day.totalProtein,
        carbs: acc.carbs + day.totalCarbs,
        fat: acc.fat + day.totalFat,
        estimatedCost: acc.estimatedCost + day.meals.reduce((sum: number, m: any) => sum + (m.cost || 0), 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, estimatedCost: 0 }
    );

    const mealPlan = {
      days: daysWithTotals,
      weeklyTotals,
      metadata: {
        createdAt: new Date().toISOString(),
        generationType: 'ai',
        userGoal: profile.primaryGoal,
        budget,
        preferences,
      },
    };

    res.json({
      success: true,
      mealPlan,
    });
  } catch (error: any) {
    console.error('[MealPlan] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate meal plan',
    });
  }
};

// Swap a single meal via Ollama
export const swapMeal = async (req: Request, res: Response) => {
  try {
    const { mealName, mealType, day, profile, budget, preferences } = req.body;

    const systemPrompt = `You are a professional nutritionist. Suggest meal alternatives that fit the user's profile. Respond with valid JSON only.`;

    const userPrompt = `Suggest 3 alternative meals for "${mealName}" (${mealType}) that fit this profile:
- Goal: ${profile.primaryGoal || 'general health'}
- Dietary Restrictions: ${profile.dietaryRestrictions?.join(', ') || 'None'}
- Budget: ${budget || '$50-100/week'}
- Preferences: ${preferences || 'None'}

Output format (JSON only):
{
  "alternatives": [
    {
      "name": "Alternative meal name",
      "calories": 300,
      "protein": 20,
      "carbs": 30,
      "fat": 10,
      "ingredients": ["ing1", "ing2"],
      "reason": "Why this is a good swap"
    }
  ]
}`;

    const response = await ollama.chat({
      model: process.env.OLLAMA_MODEL || 'phi3:mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: { num_predict: 800, temperature: 0.8 },
    });

    const content = response?.message?.content || '';
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    const alternatives = JSON.parse(jsonString.trim());

    res.json({
      success: true,
      alternatives: alternatives.alternatives || [],
    });
  } catch (error: any) {
    console.error('[MealPlan] Swap error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate meal swaps',
    });
  }
};

// Extract preferences from uploaded text/doc
export const extractPreferences = async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required',
      });
    }

    const systemPrompt = `You are a food preference analyzer. Extract dietary preferences, restrictions, and requests from text. Respond with JSON only.`;

    const userPrompt = `Analyze this text and extract food preferences:

"${text}"

Output format (JSON only):
{
  "preferences": ["likes/preferences as short phrases"],
  "avoids": ["foods to avoid"],
  "requests": ["specific meal requests or patterns"]
}

Example:
{
  "preferences": ["pasta", "Mediterranean cuisine", "quick meals"],
  "avoids": ["dairy", "shellfish"],
  "requests": ["light breakfasts", "high-protein dinners"]
}`;

    const response = await ollama.chat({
      model: process.env.OLLAMA_MODEL || 'phi3:mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: { num_predict: 300, temperature: 0.5 },
    });

    const content = response?.message?.content || '';
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    const extracted = JSON.parse(jsonString.trim());

    res.json({
      success: true,
      extracted,
    });
  } catch (error: any) {
    console.error('[MealPlan] Extract error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract preferences',
    });
  }
};

// OCR from uploaded image
export const ocrImage = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Image file is required',
      });
    }

    const imagePath = req.file.path;
    console.log('[MealPlan] Running OCR on image:', imagePath);

    const result = await Tesseract.recognize(imagePath, 'eng', {
      logger: (m) => console.log('[OCR]', m),
    });

    const text = result.data.text;

    // Clean up uploaded file
    fs.unlinkSync(imagePath);

    // Now extract preferences from OCR text
    const systemPrompt = `Extract food preferences from OCR text (may have errors). Respond with JSON only.`;
    const userPrompt = `This text was extracted from an image (OCR). Extract food preferences:

"${text}"

Output JSON format:
{
  "preferences": ["food likes"],
  "avoids": ["foods to avoid"],
  "requests": ["meal patterns"]
}`;

    const response = await ollama.chat({
      model: process.env.OLLAMA_MODEL || 'phi3:mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: { num_predict: 300 },
    });

    const content = response?.message?.content || '';
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    const extracted = JSON.parse(jsonString.trim());

    res.json({
      success: true,
      ocrText: text,
      extracted,
    });
  } catch (error: any) {
    console.error('[MealPlan] OCR error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process image',
    });
  }
};

// Generate AI insights for current plan
export const generateInsights = async (req: Request, res: Response) => {
  try {
    const { plan, profile } = req.body;

    if (!plan || !plan.days) {
      return res.status(400).json({
        success: false,
        error: 'Meal plan is required',
      });
    }

    // Calculate alignment percentage based on goal
    const avgDailyCalories = plan.weeklyTotals.calories / 7;
    const avgDailyProtein = plan.weeklyTotals.protein / 7;

    let targetCalories = 2000;
    let targetProtein = 80;

    const goal = profile?.primaryGoal || 'general_health';
    if (goal === 'weight_loss') {
      targetCalories = 1600;
      targetProtein = 100;
    } else if (goal === 'muscle_gain') {
      targetCalories = 2500;
      targetProtein = 150;
    }

    const calorieAlignment = Math.max(0, 100 - Math.abs(avgDailyCalories - targetCalories) / targetCalories * 100);
    const proteinAlignment = Math.max(0, 100 - Math.abs(avgDailyProtein - targetProtein) / targetProtein * 100);
    const alignment = Math.round((calorieAlignment + proteinAlignment) / 2);

    const systemPrompt = `You are a nutrition analyst. Analyze meal plans and provide actionable suggestions. Respond with JSON only.`;

    const planSummary = plan.days.map((d: any) => 
      `${d.day}: ${d.meals.map((m: any) => `${m.type}=${m.name} (${m.calories}kcal)`).join(', ')}`
    ).join('\n');

    const userPrompt = `Analyze this 7-day meal plan for a user with goal: ${goal}

${planSummary}

Weekly Totals: ${plan.weeklyTotals.calories}kcal, ${plan.weeklyTotals.protein}g protein, $${plan.weeklyTotals.estimatedCost}

Provide 3 specific suggestions to optimize this plan. Output JSON:
{
  "summary": "Brief 1-2 sentence overview of plan quality",
  "suggestions": [
    {
      "type": "swap",
      "meal": "Day X Mealtype",
      "alt": "Alternative meal name with macros",
      "reason": "Why this swap helps the goal"
    }
  ]
}`;

    const response = await ollama.chat({
      model: process.env.OLLAMA_MODEL || 'phi3:mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: { num_predict: 600, temperature: 0.6 },
    });

    const content = response?.message?.content || '';
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    const insights = JSON.parse(jsonString.trim());

    res.json({
      success: true,
      insight: {
        alignment,
        summary: insights.summary || 'Your plan looks good overall.',
        suggestions: insights.suggestions || [],
      },
    });
  } catch (error: any) {
    console.error('[MealPlan] Insights error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate insights',
    });
  }
};

// Generate shopping list from plan
export const generateShoppingList = async (req: Request, res: Response) => {
  try {
    const { plan, pantryItems } = req.body;

    if (!plan || !plan.days) {
      return res.status(400).json({
        success: false,
        error: 'Meal plan is required',
      });
    }

    const allIngredients = plan.days.flatMap((day: any) =>
      day.meals.flatMap((meal: any) => meal.ingredients || [])
    );

    const systemPrompt = `You are a grocery list organizer. Consolidate ingredients into categories and estimate costs. Respond with JSON only.`;

    const userPrompt = `Create a consolidated shopping list from these ingredients:
${JSON.stringify(allIngredients)}

Pantry items to exclude: ${JSON.stringify(pantryItems || [])}

Group by category (vegetables, proteins, grains, dairy, etc.), consolidate duplicates (e.g., "chicken x3 meals" → "3 chicken breasts"), estimate total cost.

Output JSON:
{
  "categories": {
    "Vegetables": ["spinach 500g", "tomatoes 6pc"],
    "Proteins": ["chicken breast 3pc", "..."],
    "Grains": ["..."],
    "Dairy": ["..."],
    "Other": ["..."]
  },
  "totalCost": 45.50
}`;

    const response = await ollama.chat({
      model: process.env.OLLAMA_MODEL || 'phi3:mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      options: { num_predict: 800, temperature: 0.5 },
    });

    const content = response?.message?.content || '';
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : content;
    const shoppingList = JSON.parse(jsonString.trim());

    res.json({
      success: true,
      shoppingList,
    });
  } catch (error: any) {
    console.error('[MealPlan] Shopping list error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate shopping list',
    });
  }
};
