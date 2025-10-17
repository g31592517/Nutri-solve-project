import { useState, useEffect } from "react";
import { Calendar, Plus, Loader2, ShoppingCart, Sparkles, Upload, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { AutoGenerateModal } from "./AutoGenerateModal";
import { ManualModeModal } from "./ManualModeModal";
import { AIInsightCard } from "./AIInsightCard";
import { AIInsightModal } from "./AIInsightModal";
import { ShoppingListModal } from "./ShoppingListModal";
import { MealSwapModal } from "./MealSwapModal";
import { WeeklyMealPlan, Meal, DayPlan, AIInsight, ExtractedPreferences, MealSwapSuggestion } from "@/types/meal-plan";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { toast } from "sonner";

const EnhancedWeeklyMealPlanner = () => {
  const { profile } = useUserProfile();
  const [mode, setMode] = useState<'smart' | 'manual'>('smart');
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentInsight, setCurrentInsight] = useState<AIInsight | null>(null);
  const [insightVisible, setInsightVisible] = useState(false);

  // Modal states
  const [autoGenerateOpen, setAutoGenerateOpen] = useState(false);
  const [manualModeOpen, setManualModeOpen] = useState(false);
  const [insightModalOpen, setInsightModalOpen] = useState(false);
  const [shoppingListOpen, setShoppingListOpen] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [mealToSwap, setMealToSwap] = useState<{ name: string; type: string; day: string } | null>(null);

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

  // Sample recipe items for drag-and-drop sidebar
  const [sampleRecipes] = useState([
    { id: "r1", name: "Greek Yogurt Bowl", calories: 250, protein: 15, carbs: 30, fat: 8, type: "breakfast" },
    { id: "r2", name: "Grilled Chicken Salad", calories: 350, protein: 35, carbs: 20, fat: 12, type: "lunch" },
    { id: "r3", name: "Salmon with Veggies", calories: 450, protein: 40, carbs: 25, fat: 18, type: "dinner" },
    { id: "r4", name: "Protein Shake", calories: 180, protein: 25, carbs: 10, fat: 5, type: "snack" },
    { id: "r5", name: "Oatmeal with Berries", calories: 280, protein: 10, carbs: 45, fat: 6, type: "breakfast" },
    { id: "r6", name: "Turkey Wrap", calories: 380, protein: 30, carbs: 35, fat: 12, type: "lunch" },
    { id: "r7", name: "Stir-Fry Tofu", calories: 320, protein: 22, carbs: 30, fat: 14, type: "dinner" },
    { id: "r8", name: "Apple with Almond Butter", calories: 200, protein: 6, carbs: 22, fat: 10, type: "snack" },
  ]);

  useEffect(() => {
    // Show insight card when plan changes
    if (mealPlan) {
      // Simulate insight generation (in real app, this would call API)
      const avgCalories = mealPlan.weeklyTotals.calories / 7;
      const alignment = calculateAlignment(avgCalories, profile.primaryGoal);
      setCurrentInsight({
        alignment,
        summary: `Avg ${Math.round(avgCalories)} kcal/day, ${Math.round(mealPlan.weeklyTotals.protein / 7)}g protein`,
        suggestions: [],
      });
      setInsightVisible(true);
    }
  }, [mealPlan]);

  const calculateAlignment = (avgCalories: number, goal?: string) => {
    const targets: Record<string, number> = {
      weight_loss: 1600,
      muscle_gain: 2500,
      maintenance: 2000,
      general_health: 2000,
    };
    const target = targets[goal || 'general_health'];
    const diff = Math.abs(avgCalories - target);
    return Math.max(0, Math.round(100 - (diff / target) * 100));
  };

  const handlePlanGenerated = (plan: WeeklyMealPlan) => {
    setMealPlan(plan);
    toast.success("Meal plan generated! 🎉");
  };

  const handlePreferencesExtracted = (preferences: ExtractedPreferences) => {
    // In a real app, update user profile with extracted preferences
    toast.success("Preferences applied! Use them in Auto-Generate.");
  };

  const handleSwapMeal = (day: string, mealType: string) => {
    if (!mealPlan) return;
    const dayPlan = mealPlan.days.find((d) => d.day === day);
    const meal = dayPlan?.meals.find((m) => m.type === mealType);
    if (meal) {
      setMealToSwap({ name: meal.name, type: mealType, day });
      setSwapModalOpen(true);
    }
  };

  const handleSwapSelected = (alternative: MealSwapSuggestion) => {
    if (!mealPlan || !mealToSwap) return;

    const updatedPlan = { ...mealPlan };
    const dayIndex = updatedPlan.days.findIndex((d) => d.day === mealToSwap.day);
    if (dayIndex >= 0) {
      const mealIndex = updatedPlan.days[dayIndex].meals.findIndex((m) => m.type === mealToSwap.type);
      if (mealIndex >= 0) {
        updatedPlan.days[dayIndex].meals[mealIndex] = {
          type: mealToSwap.type as any,
          name: alternative.name,
          calories: alternative.calories,
          protein: alternative.protein,
          carbs: alternative.carbs,
          fat: alternative.fat,
          ingredients: alternative.ingredients,
        };
        
        // Recalculate day totals
        recalculateTotals(updatedPlan);
        setMealPlan(updatedPlan);
      }
    }
  };

  const recalculateTotals = (plan: WeeklyMealPlan) => {
    plan.days = plan.days.map((day) => {
      const totals = day.meals.reduce(
        (acc, meal) => ({
          totalCalories: acc.totalCalories + meal.calories,
          totalProtein: acc.totalProtein + meal.protein,
          totalCarbs: acc.totalCarbs + meal.carbs,
          totalFat: acc.totalFat + meal.fat,
        }),
        { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
      );
      return { ...day, ...totals };
    });

    plan.weeklyTotals = plan.days.reduce(
      (acc, day) => ({
        calories: acc.calories + day.totalCalories,
        protein: acc.protein + day.totalProtein,
        carbs: acc.carbs + day.totalCarbs,
        fat: acc.fat + day.totalFat,
        estimatedCost: acc.estimatedCost,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, estimatedCost: plan.weeklyTotals.estimatedCost }
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !mealPlan) return;

    const recipeId = active.id as string;
    const recipe = sampleRecipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    const [day, mealType] = (over.id as string).split('-');
    
    const updatedPlan = { ...mealPlan };
    const dayIndex = updatedPlan.days.findIndex((d) => d.day.toLowerCase() === day.toLowerCase());
    if (dayIndex >= 0) {
      const mealIndex = updatedPlan.days[dayIndex].meals.findIndex((m) => m.type === mealType);
      if (mealIndex >= 0) {
        updatedPlan.days[dayIndex].meals[mealIndex] = {
          type: mealType as any,
          name: recipe.name,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          ingredients: [`Ingredient 1 for ${recipe.name}`, `Ingredient 2 for ${recipe.name}`],
        };
      } else {
        updatedPlan.days[dayIndex].meals.push({
          type: mealType as any,
          name: recipe.name,
          calories: recipe.calories,
          protein: recipe.protein,
          carbs: recipe.carbs,
          fat: recipe.fat,
          ingredients: [`Ingredient 1 for ${recipe.name}`, `Ingredient 2 for ${recipe.name}`],
        });
      }

      recalculateTotals(updatedPlan);
      setMealPlan(updatedPlan);
      toast.success(`${recipe.name} added to ${day} ${mealType}! 🎯`);
    }
  };

  const DraggableRecipe = ({ recipe }: { recipe: any }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
      id: recipe.id,
    });

    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`p-3 border rounded-lg cursor-grab active:cursor-grabbing hover:border-primary transition-all ${
          isDragging ? 'opacity-50 scale-95' : ''
        }`}
      >
        <h4 className="font-semibold text-sm mb-1">{recipe.name}</h4>
        <div className="flex gap-2 text-xs text-muted-foreground">
          <span>{recipe.calories} kcal</span>
          <span>{recipe.protein}g P</span>
        </div>
      </div>
    );
  };

  const DroppableMealSlot = ({ day, mealType, meal }: { day: string; mealType: string; meal?: Meal }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: `${day}-${mealType}`,
    });

    return (
      <Card
        ref={setNodeRef}
        className={`border-2 border-dashed transition-all duration-300 cursor-pointer group ${
          isOver ? 'border-primary bg-primary/5 scale-105' : 'border-muted hover:border-primary/50'
        }`}
      >
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-montserrat font-semibold text-sm capitalize">
              {mealType}
            </h4>
            {meal && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSwapMeal(day, mealType)}
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Swap
              </Button>
            )}
          </div>
          
          {meal ? (
            <div className="animate-in fade-in duration-500">
              <p className="font-semibold text-sm mb-2">{meal.name}</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                <span>{meal.calories} kcal</span>
                <span>{meal.protein}g protein</span>
                <span>{meal.carbs}g carbs</span>
                <span>{meal.fat}g fat</span>
              </div>
            </div>
          ) : (
            <div className="min-h-[80px] flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
              <Plus className="h-6 w-6 mb-1" />
              <p className="text-xs">Drag recipe or click</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <section id="meal-planner" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
              Weekly <span className="gradient-text">Meal Planner</span>
            </h2>
            <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
              AI-powered meal planning with drag-and-drop, smart insights, and export
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Recipe Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="text-lg">Suggested Recipes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
                  {sampleRecipes.map((recipe) => (
                    <DraggableRecipe key={recipe.id} recipe={recipe} />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Planner */}
            <div className="lg:col-span-3">
              <Card className="border-2 border-border shadow-elegant bg-gradient-card">
                <CardHeader className="border-b">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="font-montserrat text-2xl">
                          Your Weekly Plan
                        </CardTitle>
                        {mealPlan && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Weekly: {Math.round(mealPlan.weeklyTotals.calories)} kcal • {Math.round(mealPlan.weeklyTotals.protein)}g protein
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Mode Toggle */}
                      <div className="flex items-center gap-2 p-2 border rounded-lg">
                        <Label htmlFor="mode-toggle" className="text-xs">
                          {mode === 'smart' ? '🤖 Smart' : '✍️ Manual'}
                        </Label>
                        <Switch
                          id="mode-toggle"
                          checked={mode === 'smart'}
                          onCheckedChange={(checked) => setMode(checked ? 'smart' : 'manual')}
                        />
                      </div>

                      {mode === 'smart' ? (
                        <Button onClick={() => setAutoGenerateOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Auto-Generate
                        </Button>
                      ) : (
                        <Button onClick={() => setManualModeOpen(true)} variant="outline">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Preferences
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  {loading && (
                    <div className="text-center py-20">
                      <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                      <p className="text-muted-foreground">Loading meal plan...</p>
                    </div>
                  )}

                  {!loading && !mealPlan && (
                    <div className="text-center py-20">
                      <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="font-semibold text-xl mb-2">No Meal Plan Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        {mode === 'smart'
                          ? 'Click "Auto-Generate" to create an AI-powered meal plan'
                          : 'Upload preferences or drag recipes to build your plan manually'}
                      </p>
                    </div>
                  )}

                  {!loading && mealPlan && (
                    <Tabs defaultValue="monday" className="w-full">
                      <TabsList className="grid grid-cols-7 w-full mb-6">
                        {days.map((day) => (
                          <TabsTrigger
                            key={day}
                            value={day.toLowerCase()}
                            className="text-xs sm:text-sm"
                          >
                            {day.slice(0, 3)}
                          </TabsTrigger>
                        ))}
                      </TabsList>

                      {days.map((day) => {
                        const dayPlan = mealPlan.days.find((d) => d.day === day);
                        return (
                          <TabsContent key={day} value={day.toLowerCase()} className="space-y-4">
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                              {mealTypes.map((mealType) => {
                                const meal = dayPlan?.meals.find((m) => m.type === mealType);
                                return (
                                  <DroppableMealSlot
                                    key={mealType}
                                    day={day}
                                    mealType={mealType}
                                    meal={meal}
                                  />
                                );
                              })}
                            </div>

                            {/* Daily Summary */}
                            {dayPlan && (
                              <Card className="border-2 bg-muted/50">
                                <CardContent className="p-4">
                                  <div className="grid grid-cols-4 gap-4 text-center">
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Calories</p>
                                      <p className="text-lg font-semibold">{dayPlan.totalCalories}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Protein</p>
                                      <p className="text-lg font-semibold">{dayPlan.totalProtein}g</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                                      <p className="text-lg font-semibold">{dayPlan.totalCarbs}g</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Fat</p>
                                      <p className="text-lg font-semibold">{dayPlan.totalFat}g</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  )}

                  {/* Action Buttons */}
                  {mealPlan && (
                    <div className="flex flex-wrap justify-center gap-3 mt-6 pt-6 border-t">
                      <Button variant="outline" onClick={() => setShoppingListOpen(true)}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Shopping List
                      </Button>
                      <Button variant="outline" onClick={() => setShoppingListOpen(true)}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Export to Calendar
                      </Button>
                      <Button variant="outline" onClick={() => setInsightModalOpen(true)}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        View Insights
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modals */}
        <AutoGenerateModal
          open={autoGenerateOpen}
          onOpenChange={setAutoGenerateOpen}
          onPlanGenerated={handlePlanGenerated}
        />

        <ManualModeModal
          open={manualModeOpen}
          onOpenChange={setManualModeOpen}
          onPreferencesExtracted={handlePreferencesExtracted}
        />

        <AIInsightCard
          insight={currentInsight}
          visible={insightVisible}
          onOpenModal={() => setInsightModalOpen(true)}
          onClose={() => setInsightVisible(false)}
        />

        <AIInsightModal
          open={insightModalOpen}
          onOpenChange={setInsightModalOpen}
          plan={mealPlan}
          profile={profile}
          onApplySuggestion={(suggestion) => {
            // Handle suggestion application
            toast.success("Suggestion applied!");
          }}
        />

        <ShoppingListModal
          open={shoppingListOpen}
          onOpenChange={setShoppingListOpen}
          plan={mealPlan}
        />

        <MealSwapModal
          open={swapModalOpen}
          onOpenChange={setSwapModalOpen}
          mealToSwap={mealToSwap}
          profile={profile}
          budget={profile.weeklyBudget || '50-100'}
          preferences=""
          onSwapSelected={handleSwapSelected}
        />

        {/* AI Insight Floating Card */}
        <AIInsightCard
          insight={currentInsight}
          visible={insightVisible}
          onOpenModal={() => setInsightModalOpen(true)}
          onClose={() => setInsightVisible(false)}
        />
      </section>
    </DndContext>
  );
};

export default EnhancedWeeklyMealPlanner;
