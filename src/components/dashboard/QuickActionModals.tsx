import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type ActionType = "meal" | "water" | "exercise" | "weight" | null;

interface QuickActionModalsProps {
  activeAction: ActionType;
  onClose: () => void;
}

export const QuickActionModals = ({ activeAction, onClose }: QuickActionModalsProps) => {
  const [mealName, setMealName] = useState("");
  const [calories, setCalories] = useState("");
  const [waterOunces, setWaterOunces] = useState("");
  const [exerciseType, setExerciseType] = useState("");
  const [duration, setDuration] = useState("");
  const [weight, setWeight] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let message = "";
    switch (activeAction) {
      case "meal":
        message = `Logged ${mealName} with ${calories} calories`;
        break;
      case "water":
        message = `Logged ${waterOunces} oz of water`;
        break;
      case "exercise":
        message = `Logged ${duration} minutes of ${exerciseType}`;
        break;
      case "weight":
        message = `Updated weight to ${weight} lbs`;
        break;
    }

    toast({
      title: "Success!",
      description: message,
    });

    // Reset forms
    setMealName("");
    setCalories("");
    setWaterOunces("");
    setExerciseType("");
    setDuration("");
    setWeight("");
    onClose();
  };

  const getTitle = () => {
    switch (activeAction) {
      case "meal":
        return "Log Meal";
      case "water":
        return "Track Water";
      case "exercise":
        return "Log Exercise";
      case "weight":
        return "Update Weight";
      default:
        return "";
    }
  };

  return (
    <Dialog open={!!activeAction} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-montserrat font-bold">
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeAction === "meal" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="meal-name">Meal Name</Label>
                <Input
                  id="meal-name"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="e.g., Grilled Chicken Salad"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="calories">Calories</Label>
                <Input
                  id="calories"
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="e.g., 450"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meal-notes">Notes (optional)</Label>
                <Textarea
                  id="meal-notes"
                  placeholder="Add any additional details..."
                  rows={3}
                />
              </div>
            </>
          )}

          {activeAction === "water" && (
            <div className="space-y-2">
              <Label htmlFor="water-ounces">Water Intake (oz)</Label>
              <Input
                id="water-ounces"
                type="number"
                value={waterOunces}
                onChange={(e) => setWaterOunces(e.target.value)}
                placeholder="e.g., 16"
                required
              />
              <p className="text-sm text-muted-foreground">
                Recommended: 64 oz per day
              </p>
            </div>
          )}

          {activeAction === "exercise" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="exercise-type">Exercise Type</Label>
                <Input
                  id="exercise-type"
                  value={exerciseType}
                  onChange={(e) => setExerciseType(e.target.value)}
                  placeholder="e.g., Running, Yoga, Weightlifting"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g., 30"
                  required
                />
              </div>
            </>
          )}

          {activeAction === "weight" && (
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g., 165.5"
                required
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Log Entry
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
