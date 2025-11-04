import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, Clock, Flame } from "lucide-react";
import { MealDetailsModal } from "./MealDetailsModal";

interface MealCardProps {
  meal: {
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
  };
}

export const MealCard = ({ meal }: MealCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mealTypeColors = {
    breakfast: "bg-[hsl(var(--meal-breakfast)/0.1)] border-[hsl(var(--meal-breakfast)/0.3)]",
    lunch: "bg-[hsl(var(--meal-lunch)/0.1)] border-[hsl(var(--meal-lunch)/0.3)]",
    dinner: "bg-[hsl(var(--meal-dinner)/0.1)] border-[hsl(var(--meal-dinner)/0.3)]",
  };

  const mealTypeTextColors = {
    breakfast: "text-[hsl(var(--meal-breakfast))]",
    lunch: "text-[hsl(var(--meal-lunch))]",
    dinner: "text-[hsl(var(--meal-dinner))]",
  };

  return (
    <>
      <Card
        className={`p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 ${mealTypeColors[meal.type]} cursor-pointer group`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wider ${mealTypeTextColors[meal.type]} mb-1`}>
              {meal.type}
            </p>
            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {meal.name}
            </h4>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all group-hover:translate-y-1" />
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          <div className="flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            <span>{meal.calories} kcal</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{meal.prepTime} min</span>
          </div>
        </div>

        <div className="flex gap-3 text-xs">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Protein</span>
            <span className="font-semibold text-foreground">{meal.protein}g</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Carbs</span>
            <span className="font-semibold text-foreground">{meal.carbs}g</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Fats</span>
            <span className="font-semibold text-foreground">{meal.fats}g</span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-xs hover:bg-primary/10 hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            setIsModalOpen(true);
          }}
        >
          See Details
        </Button>
      </Card>

      <MealDetailsModal
        meal={meal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
