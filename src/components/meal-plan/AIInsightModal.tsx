import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, TrendingUp, Sparkles, CheckCircle } from "lucide-react";
import { mealPlanApi } from "@/lib/api";
import { toast } from "sonner";
import { AIInsight, InsightSuggestion, WeeklyMealPlan } from "@/types/meal-plan";

interface AIInsightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: WeeklyMealPlan | null;
  profile: any;
  onApplySuggestion: (suggestion: InsightSuggestion) => void;
}

export const AIInsightModal = ({ open, onOpenChange, plan, profile, onApplySuggestion }: AIInsightModalProps) => {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<AIInsight | null>(null);

  useEffect(() => {
    if (open && plan) {
      generateInsights();
    }
  }, [open, plan]);

  const generateInsights = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      const response = await mealPlanApi.generateInsights(plan, profile);

      if (response.success && response.insight) {
        setInsight(response.insight);
      } else {
        throw new Error(response.error || 'Failed to generate insights');
      }
    } catch (error: any) {
      console.error('Insights error:', error);
      toast.error(error.message || 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: InsightSuggestion) => {
    onApplySuggestion(suggestion);
    toast.success("Suggestion applied! Plan updated. 🎯");
  };

  const getAlignmentColor = (alignment: number) => {
    if (alignment >= 80) return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
    if (alignment >= 60) return "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30";
    return "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-montserrat flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            AI Plan Optimization
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing your meal plan...</p>
          </div>
        )}

        {!loading && insight && (
          <div className="space-y-6 py-4">
            {/* Alignment Score */}
            <Card className={getAlignmentColor(insight.alignment)}>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-3" />
                <h3 className="text-3xl font-bold mb-2">{insight.alignment}%</h3>
                <p className="text-sm">
                  Goal Alignment Score
                </p>
              </CardContent>
            </Card>

            {/* Summary */}
            <div className="bg-muted/50 p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">Overview</h3>
              <p className="text-sm text-muted-foreground">{insight.summary}</p>
            </div>

            {/* Suggestions */}
            {insight.suggestions && insight.suggestions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Optimization Suggestions
                </h3>
                {insight.suggestions.map((suggestion, index) => (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-semibold">
                              {suggestion.type.toUpperCase()}
                            </span>
                            <span className="text-sm font-semibold">{suggestion.meal}</span>
                          </div>
                          <p className="text-sm mb-2">
                            <span className="font-semibold">Swap to:</span> {suggestion.alt}
                          </p>
                          {suggestion.macros && (
                            <div className="flex gap-3 text-xs text-muted-foreground mb-2">
                              <span>{suggestion.macros.calories} kcal</span>
                              <span>{suggestion.macros.protein}g protein</span>
                              <span>{suggestion.macros.carbs}g carbs</span>
                              <span>{suggestion.macros.fat}g fat</span>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            💡 {suggestion.reason}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleApplySuggestion(suggestion)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Apply
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {(!insight.suggestions || insight.suggestions.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                <p>Your plan looks great! No optimization needed.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
