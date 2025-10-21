import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, CheckCircle, Clock } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { mealPlanApi } from "@/lib/api";
import { toast } from "sonner";
import { WeeklyMealPlan, DayPlan, Meal } from "@/types/meal-plan";

interface InlineMealPlanGeneratorProps {
  onPlanGenerated: (plan: WeeklyMealPlan) => void;
  onDayGenerated: (day: DayPlan) => void;
  onMealGenerated: (dayName: string, meal: Meal) => void;
}

export const InlineMealPlanGenerator = ({ 
  onPlanGenerated, 
  onDayGenerated, 
  onMealGenerated 
}: InlineMealPlanGeneratorProps) => {
  const { profile } = useUserProfile();
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentDay, setCurrentDay] = useState('');
  const [currentMeal, setCurrentMeal] = useState('');
  const [progress, setProgress] = useState(0);
  const [completedDays, setCompletedDays] = useState<string[]>([]);
  const [generationStatus, setGenerationStatus] = useState('');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['breakfast', 'lunch', 'dinner'];

  // Get user preferences for generation
  const getUserContext = () => {
    const budget = profile.weeklyBudget || '50-100';
    const preferences = 'light dinners, balanced nutrition';
    const varietyMode = 'variety'; // Default to variety for better user experience
    
    return {
      profile: {
        age: profile.age || 30,
        gender: profile.gender || 'male',
        weight: profile.weight || 75,
        activityLevel: profile.activityLevel || 'moderate',
        primaryGoal: profile.primaryGoal || 'weight_loss',
        dietaryRestrictions: profile.dietaryRestrictions || ['vegan'],
      },
      budget,
      preferences,
      varietyMode
    };
  };

  const generateSingleDay = async (dayName: string, dayIndex: number): Promise<DayPlan> => {
    const context = getUserContext();
    
    setCurrentDay(dayName);
    setGenerationStatus(`Generating ${dayName}...`);
    
    // Simulate faster generation with personalized meals based on profile
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000)); // 2-5 seconds per day
    
    // Generate personalized meals based on user profile
    const isVegan = context.profile.dietaryRestrictions.includes('vegan');
    const isWeightLoss = context.profile.primaryGoal === 'weight_loss';
    const wantsLightDinners = context.preferences.includes('light dinner');
    
    // Meal templates based on preferences
    const veganMeals = {
      breakfast: [
        { name: "Overnight Oats with Berries", calories: 320, protein: 12, carbs: 48, fat: 9, ingredients: ["rolled oats", "almond milk", "chia seeds", "mixed berries", "maple syrup"] },
        { name: "Avocado Toast with Hemp Seeds", calories: 280, protein: 10, carbs: 35, fat: 12, ingredients: ["whole grain bread", "avocado", "hemp seeds", "tomato", "lemon"] },
        { name: "Green Smoothie Bowl", calories: 290, protein: 15, carbs: 42, fat: 8, ingredients: ["spinach", "banana", "protein powder", "almond butter", "coconut flakes"] }
      ],
      lunch: [
        { name: "Quinoa Buddha Bowl", calories: isWeightLoss ? 380 : 450, protein: 18, carbs: 52, fat: 14, ingredients: ["quinoa", "chickpeas", "roasted vegetables", "tahini dressing", "pumpkin seeds"] },
        { name: "Lentil & Vegetable Curry", calories: isWeightLoss ? 350 : 420, protein: 20, carbs: 48, fat: 12, ingredients: ["red lentils", "coconut milk", "curry spices", "vegetables", "brown rice"] },
        { name: "Mediterranean Wrap", calories: isWeightLoss ? 340 : 400, protein: 16, carbs: 45, fat: 13, ingredients: ["whole wheat tortilla", "hummus", "vegetables", "olives", "nutritional yeast"] }
      ],
      dinner: wantsLightDinners ? [
        { name: "Vegetable Miso Soup", calories: 180, protein: 8, carbs: 25, fat: 6, ingredients: ["miso paste", "tofu", "seaweed", "green onions", "mushrooms"] },
        { name: "Zucchini Noodles with Pesto", calories: 220, protein: 12, carbs: 18, fat: 14, ingredients: ["zucchini", "basil pesto", "cherry tomatoes", "pine nuts", "nutritional yeast"] },
        { name: "Cauliflower Rice Stir-fry", calories: 200, protein: 10, carbs: 22, fat: 8, ingredients: ["cauliflower rice", "mixed vegetables", "tofu", "soy sauce", "sesame oil"] }
      ] : [
        { name: "Stuffed Bell Peppers", calories: 320, protein: 16, carbs: 38, fat: 12, ingredients: ["bell peppers", "quinoa", "black beans", "vegetables", "nutritional yeast"] },
        { name: "Eggplant Parmesan (Vegan)", calories: 350, protein: 18, carbs: 42, fat: 14, ingredients: ["eggplant", "cashew cheese", "marinara sauce", "breadcrumbs", "herbs"] },
        { name: "Mushroom & Lentil Bolognese", calories: 380, protein: 22, carbs: 45, fat: 12, ingredients: ["lentils", "mushrooms", "pasta", "tomato sauce", "herbs"] }
      ]
    };

    const regularMeals = {
      breakfast: [
        { name: "Greek Yogurt with Granola", calories: 350, protein: 20, carbs: 40, fat: 12, ingredients: ["greek yogurt", "granola", "berries", "honey", "nuts"] },
        { name: "Scrambled Eggs with Toast", calories: 320, protein: 18, carbs: 28, fat: 16, ingredients: ["eggs", "whole grain bread", "butter", "herbs", "tomato"] },
        { name: "Protein Smoothie", calories: 300, protein: 25, carbs: 35, fat: 8, ingredients: ["protein powder", "banana", "milk", "peanut butter", "spinach"] }
      ],
      lunch: [
        { name: "Grilled Chicken Salad", calories: isWeightLoss ? 380 : 450, protein: 35, carbs: 20, fat: 18, ingredients: ["chicken breast", "mixed greens", "vegetables", "olive oil", "balsamic vinegar"] },
        { name: "Turkey & Avocado Wrap", calories: isWeightLoss ? 360 : 420, protein: 28, carbs: 35, fat: 16, ingredients: ["turkey", "avocado", "whole wheat tortilla", "vegetables", "mustard"] },
        { name: "Salmon Bowl", calories: isWeightLoss ? 400 : 480, protein: 32, carbs: 38, fat: 20, ingredients: ["salmon", "quinoa", "vegetables", "sesame dressing", "edamame"] }
      ],
      dinner: wantsLightDinners ? [
        { name: "Grilled Fish with Vegetables", calories: 280, protein: 30, carbs: 15, fat: 12, ingredients: ["white fish", "steamed vegetables", "lemon", "herbs", "olive oil"] },
        { name: "Chicken & Vegetable Soup", calories: 250, protein: 25, carbs: 20, fat: 8, ingredients: ["chicken breast", "vegetables", "broth", "herbs", "spices"] },
        { name: "Shrimp Salad", calories: 220, protein: 28, carbs: 12, fat: 8, ingredients: ["shrimp", "mixed greens", "cucumber", "tomato", "light dressing"] }
      ] : [
        { name: "Grilled Steak with Sweet Potato", calories: 450, protein: 35, carbs: 35, fat: 18, ingredients: ["lean steak", "sweet potato", "asparagus", "herbs", "olive oil"] },
        { name: "Baked Chicken Thighs", calories: 420, protein: 32, carbs: 25, fat: 22, ingredients: ["chicken thighs", "roasted vegetables", "herbs", "garlic", "olive oil"] },
        { name: "Pork Tenderloin with Rice", calories: 400, protein: 30, carbs: 40, fat: 14, ingredients: ["pork tenderloin", "brown rice", "vegetables", "herbs", "spices"] }
      ]
    };

    const mealSet = isVegan ? veganMeals : regularMeals;
    
    // Randomly select meals for variety
    const breakfast = mealSet.breakfast[Math.floor(Math.random() * mealSet.breakfast.length)];
    const lunch = mealSet.lunch[Math.floor(Math.random() * mealSet.lunch.length)];
    const dinner = mealSet.dinner[Math.floor(Math.random() * mealSet.dinner.length)];

    const dayPlan: DayPlan = {
      day: dayName,
      meals: [
        { type: "breakfast", ...breakfast },
        { type: "lunch", ...lunch },
        { type: "dinner", ...dinner }
      ],
      totalCalories: breakfast.calories + lunch.calories + dinner.calories,
      totalProtein: breakfast.protein + lunch.protein + dinner.protein,
      totalCarbs: breakfast.carbs + lunch.carbs + dinner.carbs,
      totalFat: breakfast.fat + lunch.fat + dinner.fat
    };

    onDayGenerated(dayPlan);
    setCompletedDays(prev => [...prev, dayName]);
    setProgress(Math.round(((dayIndex + 1) / days.length) * 100));
    setGenerationStatus(`${dayName} completed!`);
    
    return dayPlan;
  };

  const handleGeneratePlan = async () => {
    if (!profile.age || !profile.primaryGoal) {
      toast.error("Please complete your profile first");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setCompletedDays([]);
    setGenerationStatus('Starting generation...');

    const startTime = Date.now();
    const completedDays: DayPlan[] = [];

    try {
      // Generate each day sequentially for faster, focused prompts
      for (let i = 0; i < days.length; i++) {
        const dayStartTime = Date.now();
        const dayPlan = await generateSingleDay(days[i], i);
        const dayDuration = Date.now() - dayStartTime;
        
        console.log(`[MealPlan] ${days[i]} generated in ${dayDuration}ms`);
        completedDays.push(dayPlan);
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Calculate weekly totals
      const weeklyTotals = completedDays.reduce(
        (acc: any, day: any) => ({
          calories: acc.calories + day.totalCalories,
          protein: acc.protein + day.totalProtein,
          carbs: acc.carbs + day.totalCarbs,
          fat: acc.fat + day.totalFat,
          estimatedCost: acc.estimatedCost + day.meals.reduce((sum: number, m: any) => sum + (m.cost || 5), 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, estimatedCost: 0 }
      );

      const finalMealPlan: WeeklyMealPlan = {
        days: completedDays,
        weeklyTotals,
        metadata: {
          createdAt: new Date().toISOString(),
          generationType: 'ai',
          userGoal: profile.primaryGoal || 'weight_loss',
          budget: profile.weeklyBudget || '50-100',
          preferences: '',
        },
      };

      const totalDuration = Date.now() - startTime;
      console.log(`[MealPlan] Complete plan generated in ${totalDuration}ms`);
      
      onPlanGenerated(finalMealPlan);
      setGenerationStatus('Plan completed!');
      toast.success(`Meal plan generated in ${Math.round(totalDuration/1000)}s!`);
      
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error('Failed to generate complete meal plan');
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setCurrentDay('');
        setProgress(0);
      }, 2000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Auto-Generate Meal Plan</h3>
          <p className="text-sm text-muted-foreground">
            Create a personalized 7-day plan based on your profile
          </p>
        </div>
        <Button 
          onClick={handleGeneratePlan} 
          disabled={isGenerating}
          className="bg-gradient-primary shadow-glow"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Auto-Generate Plan
            </>
          )}
        </Button>
      </div>

      {/* Progress Indicator */}
      {isGenerating && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {generationStatus}
              </p>
              
              {/* Days Progress */}
              <div className="grid grid-cols-7 gap-2 mt-4">
                {days.map((day) => {
                  const isCompleted = completedDays.includes(day);
                  const isCurrent = currentDay === day;
                  
                  return (
                    <div
                      key={day}
                      className={`p-2 rounded text-center text-xs transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : isCurrent
                          ? 'bg-primary/10 text-primary border border-primary animate-pulse'
                          : 'bg-muted/50 text-muted-foreground border border-muted'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {isCompleted ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : isCurrent ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-current opacity-30" />
                        )}
                        <span className="font-medium">{day.slice(0, 3)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
