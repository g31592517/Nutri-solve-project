import { MealCard } from "./MealCard";

interface Meal {
  id: string;
  name: string;
  type: "breakfast" | "lunch" | "dinner";
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  prepTime: number;
  ingredients: string[];
  instructions: string[];
}

interface DayColumnProps {
  day: string;
  date: string;
  meals: Meal[];
  totalMeals: number;
  isGenerating?: boolean;
  animationDelay?: number;
}

export const DayColumn = ({ 
  day, 
  date, 
  meals, 
  totalMeals,
  isGenerating = false,
  animationDelay = 0 
}: DayColumnProps) => {
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);

  return (
    <div 
      className="flex flex-col min-w-[320px] animate-slide-in-scale"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="bg-card rounded-t-xl border-2 border-b-0 border-border p-4 sticky top-0 z-10 shadow-sm">
        <h3 className="font-bold text-lg text-foreground">{day}</h3>
        <p className="text-sm text-muted-foreground">{date}</p>
        <div className="flex gap-3 mt-2 text-xs">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold text-primary">{totalCalories} kcal</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Protein</span>
            <span className="font-semibold text-primary">{totalProtein}g</span>
          </div>
        </div>
      </div>
      <div className="space-y-3 p-4 bg-card/50 rounded-b-xl border-2 border-t-0 border-border min-h-[400px]">
        {meals.map((meal, index) => (
          <div 
            key={meal.id}
            className="animate-scale-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <MealCard meal={meal} />
          </div>
        ))}
        {isGenerating && meals.length < totalMeals && (
          <div className="border-2 border-dashed border-border rounded-xl p-6 animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
