import { useState, useEffect, useRef } from "react";
import { Calendar, Sparkles, CalendarDays, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { toast } from "sonner";
import { DayColumn } from "./DayColumn";
import { MealPlanGeneratorModal } from "./MealPlanGeneratorModal";

interface Meal {
  type: "breakfast" | "lunch" | "dinner";
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  prepTime?: number;
}

interface DayPlan {
  day: string;
  date?: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

interface WeeklyMealPlan {
  days: DayPlan[];
  weeklyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    estimatedCost: number;
  };
  metadata?: {
    createdAt: string;
    generationType: string;
    userGoal: string;
    budget: string;
    preferences: string;
  };
}

const OptimizedWeeklyMealPlanner = () => {
  const { profile } = useUserProfile();
  const [isSmartMode, setIsSmartMode] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [revealedDays, setRevealedDays] = useState(0);
  const [revealedMealsInCurrentDay, setRevealedMealsInCurrentDay] = useState(0);
  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentStatus, setCurrentStatus] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Get current date for each day
  const getDayDate = (dayIndex: number) => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + dayIndex);
    
    return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleGeneratePlan = async (preferences: {
    budget: string;
    preferences: string;
    varietyMode: string;
  }) => {
    setIsGenerating(true);
    setRevealedDays(0);
    setCurrentProgress(0);
    setCurrentStatus("Initializing...");
    setMealPlan(null);

    try {
      // Use streaming endpoint for optimized generation
      const response = await fetch('/api/meal-plan/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            age: profile.age,
            gender: profile.gender,
            weight: profile.weight,
            activityLevel: profile.activityLevel,
            primaryGoal: profile.primaryGoal,
            dietaryRestrictions: profile.dietaryRestrictions || [],
          },
          budget: preferences.budget,
          preferences: preferences.preferences,
          varietyMode: preferences.varietyMode,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate meal plan');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const completedDays: DayPlan[] = [];

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setIsGenerating(false);
              continue;
            }

            try {
              const event = JSON.parse(data);

              if (event.type === 'status') {
                setCurrentStatus(event.message);
                setCurrentProgress(event.progress);
              } else if (event.type === 'meal') {
                // Progressive meal reveal - add meal to current day
                const currentDayIndex = completedDays.length;
                if (!completedDays[currentDayIndex]) {
                  completedDays[currentDayIndex] = {
                    day: days[currentDayIndex],
                    meals: [],
                    totalCalories: 0,
                    totalProtein: 0,
                    totalCarbs: 0,
                    totalFat: 0,
                  };
                }
                completedDays[currentDayIndex].meals.push(event.meal);
                completedDays[currentDayIndex].totalCalories += event.meal.calories;
                completedDays[currentDayIndex].totalProtein += event.meal.protein;
                completedDays[currentDayIndex].totalCarbs += event.meal.carbs;
                completedDays[currentDayIndex].totalFat += event.meal.fat;
                
                setRevealedMealsInCurrentDay(completedDays[currentDayIndex].meals.length);
                setRevealedDays(completedDays.length);
                
                // Update meal plan progressively
                const weeklyTotals = completedDays.reduce(
                  (acc, day) => ({
                    calories: acc.calories + day.totalCalories,
                    protein: acc.protein + day.totalProtein,
                    carbs: acc.carbs + day.totalCarbs,
                    fat: acc.fat + day.totalFat,
                    estimatedCost: acc.estimatedCost,
                  }),
                  { calories: 0, protein: 0, carbs: 0, fat: 0, estimatedCost: 0 }
                );

                setMealPlan({
                  days: completedDays,
                  weeklyTotals,
                  metadata: {
                    createdAt: new Date().toISOString(),
                    generationType: 'ai-streaming',
                    userGoal: profile.primaryGoal || 'general_health',
                    budget: '',
                    preferences: '',
                  },
                });
              } else if (event.type === 'day_complete') {
                setRevealedMealsInCurrentDay(0);
                setCurrentProgress(event.progress);
                
                // Update meal plan with completed days
                const weeklyTotals = completedDays.reduce(
                  (acc, day) => ({
                    calories: acc.calories + day.totalCalories,
                    protein: acc.protein + day.totalProtein,
                    carbs: acc.carbs + day.totalCarbs,
                    fat: acc.fat + day.totalFat,
                    estimatedCost: acc.estimatedCost,
                  }),
                  { calories: 0, protein: 0, carbs: 0, fat: 0, estimatedCost: 0 }
                );

                setMealPlan({
                  days: completedDays,
                  weeklyTotals,
                  metadata: {
                    createdAt: new Date().toISOString(),
                    generationType: 'ai-streaming',
                    userGoal: profile.primaryGoal || 'general_health',
                    budget: preferences.budget,
                    preferences: preferences.preferences,
                  },
                });
              } else if (event.type === 'complete') {
                setMealPlan(event.mealPlan);
                setIsGenerating(false);
                setCurrentProgress(100);
                toast.success("Meal plan generated successfully! 🎉");
              } else if (event.type === 'error') {
                throw new Error(event.message);
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error generating meal plan:', error);
      toast.error(error.message || 'Failed to generate meal plan');
      setIsGenerating(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  return (
    <section id="meal-planner" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
            Weekly <span className="gradient-text">Meal Planner</span>
          </h2>
          <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
            AI-powered meal planning with optimized streaming for fast results
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <Card className="border-2 border-border shadow-elegant bg-gradient-card">
            <CardContent className="p-6">
              {/* Header Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-6 h-6 text-primary" />
                  <h2 className="text-2xl font-bold text-foreground">Your Weekly Plan</h2>
                  {mealPlan && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {Math.round(mealPlan.weeklyTotals.calories)} kcal • {Math.round(mealPlan.weeklyTotals.protein)}g protein
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="smart-mode"
                      checked={isSmartMode}
                      onCheckedChange={setIsSmartMode}
                    />
                    <Label htmlFor="smart-mode" className="text-sm font-medium cursor-pointer">
                      🧠 Smart
                    </Label>
                  </div>
                  <Button
                    onClick={() => setGeneratorOpen(true)}
                    disabled={isGenerating}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Auto-Generate Plan
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Progress Indicator */}
              {isGenerating && (
                <div className="mb-6 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                    <span>
                      Generating {revealedDays > 0 ? days[revealedDays - 1] : days[0]}...
                      ({revealedMealsInCurrentDay}/3 meals)
                    </span>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!mealPlan && !isGenerating && (
                <div className="flex flex-col items-center justify-center py-20 px-4">
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6 animate-fade-in">
                    <Calendar className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No Meal Plan Yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Click "Auto-Generate Plan" to create an AI-powered meal plan tailored to your preferences and nutritional goals
                  </p>
                </div>
              )}

              {/* Meal Plan Display with Dynamic Layouts */}
              {mealPlan && mealPlan.days.length > 0 && (
                <div>
                  {/* Monday: Full-width single column */}
                  {revealedDays === 1 && (
                    <div className="mb-4">
                      {mealPlan.days.slice(0, 1).map((day, index) => {
                        const isCurrentDay = index === revealedDays - 1;
                        const mealsToShow = isCurrentDay ? revealedMealsInCurrentDay : day.meals.length;
                        
                        return (
                          <DayColumn
                            key={day.day}
                            day={day.day}
                            date={getDayDate(index)}
                            meals={day.meals.slice(0, mealsToShow).map((meal, mealIndex) => ({
                              id: `${day.day}-${meal.type}-${mealIndex}`,
                              name: meal.name,
                              type: meal.type,
                              calories: meal.calories,
                              protein: meal.protein,
                              carbs: meal.carbs,
                              fats: meal.fat,
                              prepTime: meal.prepTime || 20,
                              ingredients: meal.ingredients,
                              instructions: [`Prepare ${meal.name}`],
                            }))}
                            totalMeals={3}
                            isGenerating={isCurrentDay && isGenerating}
                            animationDelay={0}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Tuesday: Two-column grid */}
                  {revealedDays === 2 && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {mealPlan.days.slice(0, 2).map((day, index) => {
                        const isCurrentDay = index === revealedDays - 1;
                        const mealsToShow = isCurrentDay ? revealedMealsInCurrentDay : day.meals.length;
                        
                        return (
                          <DayColumn
                            key={day.day}
                            day={day.day}
                            date={getDayDate(index)}
                            meals={day.meals.slice(0, mealsToShow).map((meal, mealIndex) => ({
                              id: `${day.day}-${meal.type}-${mealIndex}`,
                              name: meal.name,
                              type: meal.type,
                              calories: meal.calories,
                              protein: meal.protein,
                              carbs: meal.carbs,
                              fats: meal.fat,
                              prepTime: meal.prepTime || 20,
                              ingredients: meal.ingredients,
                              instructions: [`Prepare ${meal.name}`],
                            }))}
                            totalMeals={3}
                            isGenerating={isCurrentDay && isGenerating}
                            animationDelay={index * 100}
                          />
                        );
                      })}
                    </div>
                  )}

                  {/* Wednesday+: Horizontal scroll */}
                  {revealedDays >= 3 && (
                    <ScrollArea className="w-full whitespace-nowrap">
                      <div className="flex gap-4 pb-4">
                        {mealPlan.days.map((day, index) => {
                          const isCurrentDay = index === revealedDays - 1;
                          const mealsToShow = isCurrentDay ? revealedMealsInCurrentDay : day.meals.length;
                          
                          return (
                            <DayColumn
                              key={day.day}
                              day={day.day}
                              date={getDayDate(index)}
                              meals={day.meals.slice(0, mealsToShow).map((meal, mealIndex) => ({
                                id: `${day.day}-${meal.type}-${mealIndex}`,
                                name: meal.name,
                                type: meal.type,
                                calories: meal.calories,
                                protein: meal.protein,
                                carbs: meal.carbs,
                                fats: meal.fat,
                                prepTime: meal.prepTime || 20,
                                ingredients: meal.ingredients,
                                instructions: [`Prepare ${meal.name}`],
                              }))}
                              totalMeals={3}
                              isGenerating={isCurrentDay && isGenerating}
                              animationDelay={index * 100}
                            />
                          );
                        })}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  )}

                  {/* Weekly Summary */}
                  {!isGenerating && mealPlan.days.length === days.length && (
                    <div className="mt-6 p-4 bg-secondary/50 rounded-lg animate-fade-in">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-1">Weekly Summary</h4>
                          <p className="text-sm text-muted-foreground">
                            Complete nutrition plan for optimal health and performance
                          </p>
                        </div>
                        <div className="flex gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">
                              {Math.round(mealPlan.weeklyTotals.calories)}
                            </p>
                            <p className="text-xs text-muted-foreground">Total Calories</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">
                              {Math.round(mealPlan.weeklyTotals.protein)}g
                            </p>
                            <p className="text-xs text-muted-foreground">Total Protein</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">
                              {mealPlan.days.length * 3}
                            </p>
                            <p className="text-xs text-muted-foreground">Meals Planned</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generator Modal */}
      <MealPlanGeneratorModal
        open={generatorOpen}
        onOpenChange={setGeneratorOpen}
        onGenerate={handleGeneratePlan}
      />
    </section>
  );
};

export default OptimizedWeeklyMealPlanner;
