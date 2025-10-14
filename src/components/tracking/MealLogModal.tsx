import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useGamification } from "@/contexts/GamificationContext";
import { useToast } from "@/hooks/use-toast";
import { Utensils } from "lucide-react";

interface MealLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MealLogModal = ({ isOpen, onClose }: MealLogModalProps) => {
  const { logMeal } = useGamification();
  const { toast } = useToast();
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please describe your meal",
        variant: "destructive",
      });
      return;
    }

    logMeal({
      date: new Date().toISOString(),
      mealType,
      description,
      estimatedCalories: calories ? parseInt(calories) : undefined,
    });

    toast({
      title: "🍽️ Meal Logged!",
      description: "Keep up the great work!",
    });

    // Reset form
    setDescription('');
    setCalories('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5 text-primary" />
            Log Your Meal
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="mealType">Meal Type</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <Button
                  key={type}
                  type="button"
                  variant={mealType === type ? "default" : "outline"}
                  onClick={() => setMealType(type)}
                  className="capitalize"
                  size="sm"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description">What did you eat? *</Label>
            <Textarea
              id="description"
              placeholder="E.g., Grilled chicken salad with olive oil, quinoa bowl..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="calories">Estimated Calories (optional)</Label>
            <Input
              id="calories"
              type="number"
              placeholder="500"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-primary shadow-glow">
              Log Meal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
