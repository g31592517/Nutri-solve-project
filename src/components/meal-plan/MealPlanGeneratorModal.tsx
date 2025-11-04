import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles } from "lucide-react";

interface MealPlanGeneratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (preferences: {
    budget: string;
    preferences: string;
    varietyMode: string;
  }) => void;
}

export const MealPlanGeneratorModal = ({
  open,
  onOpenChange,
  onGenerate,
}: MealPlanGeneratorModalProps) => {
  const [budget, setBudget] = useState("50-100");
  const [preferences, setPreferences] = useState("");
  const [varietyMode, setVarietyMode] = useState("varied");

  const handleGenerate = () => {
    onGenerate({
      budget,
      preferences,
      varietyMode,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Meal Plan
          </DialogTitle>
          <DialogDescription>
            Customize your weekly meal plan based on your preferences and budget
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Budget Selection */}
          <div className="space-y-2">
            <Label htmlFor="budget">Weekly Budget</Label>
            <Select value={budget} onValueChange={setBudget}>
              <SelectTrigger id="budget">
                <SelectValue placeholder="Select budget range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20-50">$20-50 per week</SelectItem>
                <SelectItem value="50-100">$50-100 per week</SelectItem>
                <SelectItem value="100-150">$100-150 per week</SelectItem>
                <SelectItem value="150+">$150+ per week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preferences */}
          <div className="space-y-2">
            <Label htmlFor="preferences">Special Preferences (Optional)</Label>
            <Textarea
              id="preferences"
              placeholder="E.g., light dinners, high protein breakfast, Mediterranean cuisine..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              rows={3}
            />
          </div>

          {/* Variety Mode */}
          <div className="space-y-3">
            <Label>Meal Variety</Label>
            <RadioGroup value={varietyMode} onValueChange={setVarietyMode}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="varied" id="varied" />
                <Label htmlFor="varied" className="font-normal cursor-pointer">
                  <span className="font-semibold">Varied</span> - Different meals each day
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="consistent" id="consistent" />
                <Label htmlFor="consistent" className="font-normal cursor-pointer">
                  <span className="font-semibold">Consistent</span> - Meal prep friendly with repeats
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} className="bg-primary">
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
