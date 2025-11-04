import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Flame, ChefHat } from "lucide-react";

interface MealDetailsModalProps {
  meal: {
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
  isOpen: boolean;
  onClose: () => void;
}

export const MealDetailsModal = ({ meal, isOpen, onClose }: MealDetailsModalProps) => {
  const mealTypeColors = {
    breakfast: "bg-[hsl(var(--meal-breakfast)/0.2)] text-[hsl(var(--meal-breakfast))]",
    lunch: "bg-[hsl(var(--meal-lunch)/0.2)] text-[hsl(var(--meal-lunch))]",
    dinner: "bg-[hsl(var(--meal-dinner)/0.2)] text-[hsl(var(--meal-dinner))]",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Badge className={`${mealTypeColors[meal.type]} uppercase text-xs font-semibold`}>
              {meal.type}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold">{meal.name}</DialogTitle>
        </DialogHeader>

        {/* Nutrition Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <Flame className="w-5 h-5 text-primary mb-2" />
            <span className="text-2xl font-bold text-foreground">{meal.calories}</span>
            <span className="text-xs text-muted-foreground">Calories</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <span className="text-2xl font-bold text-foreground">{meal.protein}g</span>
            <span className="text-xs text-muted-foreground">Protein</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <span className="text-2xl font-bold text-foreground">{meal.carbs}g</span>
            <span className="text-xs text-muted-foreground">Carbs</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
            <span className="text-2xl font-bold text-foreground">{meal.fats}g</span>
            <span className="text-xs text-muted-foreground">Fats</span>
          </div>
        </div>

        <Separator />

        {/* Prep Time */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Prep time: {meal.prepTime} minutes</span>
        </div>

        <Separator />

        {/* Ingredients */}
        <div>
          <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-primary" />
            Ingredients
          </h3>
          <ul className="space-y-2">
            {meal.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <span className="text-primary mt-1">•</span>
                <span className="text-foreground">{ingredient}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Instructions */}
        <div>
          <h3 className="font-semibold text-lg mb-3">Instructions</h3>
          <ol className="space-y-3">
            {meal.instructions.map((instruction, index) => (
              <li key={index} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                  {index + 1}
                </span>
                <span className="text-foreground pt-0.5">{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
};
