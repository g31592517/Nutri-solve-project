export interface UserProfile {
  // Basic Profile (Step 1)
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  height?: number; // in cm
  weight?: number; // in kg
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  
  // Goals & Restrictions (Step 2)
  primaryGoal?: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'general_health';
  dietaryRestrictions?: string[]; // e.g., ['vegan', 'gluten_free', 'nut_allergy']
  weeklyBudget?: '20-50' | '50-100' | '100-150' | '150+';
  
  // Preferences (Step 3)
  favoriteCuisines?: string[]; // e.g., ['italian', 'asian', 'mexican']
  mealFrequency?: '3_meals' | 'intermittent_fasting' | '5_small_meals' | 'flexible';
  
  // Metadata
  onboardingCompleted?: boolean;
}

export interface GamificationData {
  streaks: {
    currentStreak: number;
    longestStreak: number;
    lastActionDate: string | null;
  };
  weeklyProgress: {
    daysLogged: number;
    targetDays: number;
  };
  badges: Badge[];
  challenges: Challenge[];
  points: number;
  dailyActions: DailyAction[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  category: 'chat' | 'community' | 'tracking' | 'education' | 'challenge';
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'ongoing';
  progress: number;
  target: number;
  participants?: number;
  startDate: string;
  endDate?: string;
  reward?: string;
}

export interface DailyAction {
  type: 'chat' | 'meal_log' | 'community_post' | 'community_comment' | 'calculator' | 'myth_read';
  timestamp: string;
  metadata?: any;
}

export interface MealLog {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  estimatedCalories?: number;
}
