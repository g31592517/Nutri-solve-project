import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Sparkles, CalendarDays } from "lucide-react";
import { DayColumn } from "./DayColumn";
import { useMealPlanStreaming } from "@/hooks/useMealPlanStreaming";
import { mockWeeklyPlan } from "@/data/mockMealPlan";

interface WeeklyPlanSectionProps {
  /** Optional API endpoint for real backend integration */
  apiEndpoint?: string;
  /** Use mock data for testing (default: true) */
  useMockData?: boolean;
  /** Callback when plan generation completes */
  onPlanComplete?: () => void;
}

export const WeeklyPlanSection = ({ 
  apiEndpoint,
  useMockData = true,
  onPlanComplete 
}: WeeklyPlanSectionProps = {}) => {
  const [isSmartMode, setIsSmartMode] = useState(true);
  const { state, processStreamingResponse, simulateStreaming, reset } = useMealPlanStreaming();

  const handleGeneratePlan = async () => {
    if (apiEndpoint && !useMockData) {
      // PRODUCTION: Use real backend API streaming
      try {
        await processStreamingResponse(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mode: isSmartMode ? 'smart' : 'manual',
            // Add user preferences, dietary restrictions, etc.
          }),
        });
        onPlanComplete?.();
      } catch (error) {
        console.error('Failed to generate meal plan:', error);
      }
    } else {
      // TESTING: Simulate streaming with mock data
      await simulateStreaming(mockWeeklyPlan);
      onPlanComplete?.();
    }
  };

  const { isGenerating, currentDayIndex, currentMealIndex, completedDays, error } = state;
  const hasPlan = completedDays.length > 0;
  const revealedDays = completedDays.length;

  // Determine layout based on revealed days
  const getLayoutClass = () => {
    if (revealedDays === 0) return "";
    if (revealedDays === 1) return "grid-cols-1"; // Monday: full-width
    if (revealedDays === 2) return "grid grid-cols-2 gap-4"; // Tuesday: two columns
    return ""; // Wednesday+: horizontal scroll
  };

  const shouldUseScrollLayout = revealedDays >= 3;

  // Get current day name for generating indicator
  const getCurrentDayName = () => {
    if (currentDayIndex >= 0 && completedDays[currentDayIndex]) {
      return completedDays[currentDayIndex].day;
    }
    return 'meals';
  };

  // Get current meal count for generating indicator
  const getCurrentMealCount = () => {
    if (currentDayIndex >= 0 && completedDays[currentDayIndex]) {
      return completedDays[currentDayIndex].meals.length;
    }
    return 0;
  };

  return (
    <Card className="p-6 flex-1">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">Your Weekly Plan</h2>
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
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isGenerating ? "Generating..." : "Auto-Generate Plan"}
          </Button>
        </div>
      </div>

      {!hasPlan ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6 animate-fade-in">
            <Calendar className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No Meal Plan Yet</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Click "Auto-Generate Plan" to create an AI-powered meal plan tailored to your preferences and nutritional goals
          </p>
        </div>
      ) : (
        <div>
          {isGenerating && (
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground animate-pulse">
              <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
              <span>
                Generating {getCurrentDayName()}... 
                ({getCurrentMealCount()}/3 meals)
              </span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center gap-2 mb-4 text-sm text-destructive">
              <span>⚠️ {error}</span>
              <Button variant="ghost" size="sm" onClick={reset}>
                Retry
              </Button>
            </div>
          )}
          
          {shouldUseScrollLayout ? (
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-4 pb-4">
                {completedDays.map((day, dayIndex) => {
                  const isCurrentDay = dayIndex === currentDayIndex && isGenerating;
                  const totalMeals = 3; // Standard 3 meals per day
                  
                  return (
                    <DayColumn
                      key={day.day}
                      day={day.day}
                      date={day.date}
                      meals={day.meals}
                      totalMeals={totalMeals}
                      isGenerating={isCurrentDay}
                    />
                  );
                })}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className={getLayoutClass()}>
              {completedDays.map((day, dayIndex) => {
                const isCurrentDay = dayIndex === currentDayIndex && isGenerating;
                const totalMeals = 3; // Standard 3 meals per day
                
                return (
                  <DayColumn
                    key={day.day}
                    day={day.day}
                    date={day.date}
                    meals={day.meals}
                    totalMeals={totalMeals}
                    isGenerating={isCurrentDay}
                  />
                );
              })}
            </div>
          )}

          {!isGenerating && completedDays.length > 0 && (
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
                      {completedDays.reduce((sum, day) => 
                        sum + day.meals.reduce((mealSum, meal) => mealSum + meal.calories, 0), 0
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Calories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {completedDays.reduce((sum, day) => 
                        sum + day.meals.reduce((mealSum, meal) => mealSum + meal.protein, 0), 0
                      )}g
                    </p>
                    <p className="text-xs text-muted-foreground">Total Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">
                      {completedDays.reduce((sum, day) => sum + day.meals.length, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Meals Planned</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
