import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, X } from "lucide-react";
import { AIInsight } from "@/types/meal-plan";

interface AIInsightCardProps {
  insight: AIInsight | null;
  visible: boolean;
  onOpenModal: () => void;
  onClose: () => void;
}

export const AIInsightCard = ({ insight, visible, onOpenModal, onClose }: AIInsightCardProps) => {
  const [autoHidden, setAutoHidden] = useState(false);

  useEffect(() => {
    if (visible && !autoHidden) {
      const timer = setTimeout(() => {
        setAutoHidden(true);
      }, 10000); // Auto-hide after 10 seconds

      return () => clearTimeout(timer);
    }
  }, [visible, autoHidden]);

  useEffect(() => {
    // Reset auto-hidden when new insight arrives
    if (insight) {
      setAutoHidden(false);
    }
  }, [insight]);

  if (!insight || !visible || autoHidden) return null;

  const getAlignmentColor = (alignment: number) => {
    if (alignment >= 80) return "text-green-600 dark:text-green-400";
    if (alignment >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card className="fixed bottom-6 right-6 w-96 shadow-2xl border-2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">AI Insight</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm mb-3">
          Your weekly plan aligns{' '}
          <span className={`font-bold ${getAlignmentColor(insight.alignment)}`}>
            {insight.alignment}%
          </span>{' '}
          with your goal.
        </p>

        <div className="mb-3 text-sm text-muted-foreground">
          Total: {insight.summary || 'Looking good!'}
        </div>

        <Button
          onClick={onOpenModal}
          size="sm"
          className="w-full"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Optimize Plan
        </Button>
      </CardContent>
    </Card>
  );
};
