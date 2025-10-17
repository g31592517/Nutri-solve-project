import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, CheckCircle } from "lucide-react";
import { mealPlanApi } from "@/lib/api";
import { toast } from "sonner";
import { MealSwapSuggestion } from "@/types/meal-plan";

interface MealSwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealToSwap: {
    name: string;
    type: string;
    day: string;
  } | null;
  profile: any;
  budget: string;
  preferences: string;
  onSwapSelected: (alternative: MealSwapSuggestion) => void;
}

export const MealSwapModal = ({ 
  open, 
  onOpenChange, 
  mealToSwap, 
  profile, 
  budget, 
  preferences,
  onSwapSelected 
}: MealSwapModalProps) => {
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<MealSwapSuggestion[]>([]);

  useEffect(() => {
    if (open && mealToSwap) {
      fetchAlternatives();
    }
  }, [open, mealToSwap]);

  const fetchAlternatives = async () => {
    if (!mealToSwap) return;

    setLoading(true);
    try {
      const response = await mealPlanApi.swapMeal(
        mealToSwap.name,
        mealToSwap.type,
        mealToSwap.day,
        profile,
        budget,
        preferences
      );

      if (response.success && response.alternatives) {
        setAlternatives(response.alternatives);
      } else {
        throw new Error(response.error || 'Failed to get alternatives');
      }
    } catch (error: any) {
      console.error('Swap error:', error);
      toast.error(error.message || 'Failed to fetch meal alternatives');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSwap = (alternative: MealSwapSuggestion) => {
    onSwapSelected(alternative);
    toast.success("Meal swapped! 🔄");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-montserrat">
            Swap Meal
          </DialogTitle>
          {mealToSwap && (
            <p className="text-sm text-muted-foreground">
              Finding alternatives for <span className="font-semibold">{mealToSwap.name}</span> ({mealToSwap.day} {mealToSwap.type})
            </p>
          )}
        </DialogHeader>

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Finding perfect alternatives...</p>
          </div>
        )}

        {!loading && alternatives.length > 0 && (
          <div className="space-y-4 py-4">
            {alternatives.map((alt, index) => (
              <Card key={index} className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{alt.name}</h3>
                      
                      <div className="grid grid-cols-4 gap-2 mb-3 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Calories</p>
                          <p className="font-semibold">{alt.calories}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Protein</p>
                          <p className="font-semibold">{alt.protein}g</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Carbs</p>
                          <p className="font-semibold">{alt.carbs}g</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Fat</p>
                          <p className="font-semibold">{alt.fat}g</p>
                        </div>
                      </div>

                      {alt.ingredients && alt.ingredients.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-muted-foreground mb-1">Ingredients:</p>
                          <p className="text-sm">{alt.ingredients.join(', ')}</p>
                        </div>
                      )}

                      {alt.reason && (
                        <div className="bg-primary/5 p-2 rounded text-sm">
                          💡 {alt.reason}
                        </div>
                      )}
                    </div>

                    <Button onClick={() => handleSelectSwap(alt)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Select
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={fetchAlternatives}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Get More Alternatives
            </Button>
          </div>
        )}

        {!loading && alternatives.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>No alternatives found. Try again later.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
