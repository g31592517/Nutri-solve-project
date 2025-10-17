// Meal Planning Types
export interface Meal {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  cost?: number;
  prepTime?: number;
}

export interface DayPlan {
  day: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface WeeklyMealPlan {
  days: DayPlan[];
  weeklyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    estimatedCost: number;
  };
  metadata: {
    createdAt: string;
    generationType: 'ai' | 'manual';
    userGoal: string;
    budget?: string;
    preferences?: string;
  };
}

export interface MealSwapSuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  reason: string;
}

export interface AIInsight {
  alignment: number; // 0-100 percentage
  summary: string;
  suggestions: InsightSuggestion[];
}

export interface InsightSuggestion {
  type: 'swap' | 'add' | 'remove';
  meal: string; // e.g., "Day 1 Lunch"
  alt: string; // Alternative meal name
  macros?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  reason: string;
}

export interface ShoppingList {
  categories: {
    [category: string]: string[];
  };
  totalCost: number;
  pantryItems?: string[];
}

export interface RecipeItem {
  id: string;
  name: string;
  category: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  cost: number;
  thumbnail?: string;
}

export interface ExtractedPreferences {
  preferences: string[];
  avoids: string[];
  requests: string[];
}

export interface GeneratePlanRequest {
  profile: {
    age?: number;
    gender?: string;
    weight?: number;
    activityLevel?: string;
    primaryGoal?: string;
    dietaryRestrictions?: string[];
  };
  budget: string;
  preferences: string;
  varietyMode: 'consistent' | 'variety';
}
