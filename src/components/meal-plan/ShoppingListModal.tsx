import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Calendar, ShoppingCart, RefreshCw } from "lucide-react";
import { mealPlanApi } from "@/lib/api";
import { toast } from "sonner";
import { ShoppingList, WeeklyMealPlan } from "@/types/meal-plan";

interface ShoppingListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: WeeklyMealPlan | null;
}

export const ShoppingListModal = ({ open, onOpenChange, plan }: ShoppingListModalProps) => {
  const [loading, setLoading] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open && plan) {
      generateList();
    }
  }, [open, plan]);

  const generateList = async () => {
    if (!plan) return;

    setLoading(true);
    try {
      const response = await mealPlanApi.generateShoppingList(plan, pantryItems);

      if (response.success && response.shoppingList) {
        setShoppingList(response.shoppingList);
      } else {
        throw new Error(response.error || 'Failed to generate shopping list');
      }
    } catch (error: any) {
      console.error('Shopping list error:', error);
      toast.error(error.message || 'Failed to generate shopping list');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (item: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(item)) {
      newChecked.delete(item);
    } else {
      newChecked.add(item);
    }
    setCheckedItems(newChecked);
  };

  const downloadAsTxt = () => {
    if (!shoppingList) return;

    let content = "🛒 Shopping List\n\n";
    Object.entries(shoppingList.categories).forEach(([category, items]) => {
      content += `${category}:\n`;
      items.forEach((item) => {
        content += `  - ${item}\n`;
      });
      content += '\n';
    });
    content += `\nTotal Estimated Cost: $${shoppingList.totalCost.toFixed(2)}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Shopping list downloaded! 📥");
  };

  const downloadAsCsv = () => {
    if (!shoppingList) return;

    let content = "Category,Item\n";
    Object.entries(shoppingList.categories).forEach(([category, items]) => {
      items.forEach((item) => {
        content += `"${category}","${item}"\n`;
      });
    });

    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded! 📊");
  };

  const exportToCalendar = () => {
    if (!plan) return;

    // Generate ICS file content
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NutriSolve//Meal Plan//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH\n`;

    plan.days.forEach((day) => {
      const baseDate = new Date();
      const dayIndex = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].indexOf(day.day);
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + ((dayIndex + 7 - baseDate.getDay()) % 7));

      day.meals.forEach((meal) => {
        let startHour = 8; // Default breakfast time
        if (meal.type === 'lunch') startHour = 12;
        if (meal.type === 'dinner') startHour = 18;
        if (meal.type === 'snack') startHour = 15;

        const startDate = new Date(targetDate);
        startDate.setHours(startHour, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(startHour + 1, 0, 0, 0);

        const formatDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        icsContent += `BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}: ${meal.name}
DESCRIPTION:Calories: ${meal.calories}kcal\\nProtein: ${meal.protein}g\\nCarbs: ${meal.carbs}g\\nFat: ${meal.fat}g
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:Prep reminder for ${meal.name}
END:VALARM
END:VEVENT\n`;
      });
    });

    icsContent += `END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meal-plan.ics';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar file downloaded! 📅 Import to your calendar app.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-montserrat">
            Export & Shopping List
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="shopping" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="shopping">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Shopping List
            </TabsTrigger>
            <TabsTrigger value="calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar Export
            </TabsTrigger>
          </TabsList>

          {/* Shopping List Tab */}
          <TabsContent value="shopping" className="space-y-4 mt-4">
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Generating shopping list...</p>
              </div>
            )}

            {!loading && shoppingList && (
              <>
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg border">
                  <div>
                    <h3 className="font-semibold">Total Estimated Cost</h3>
                    <p className="text-2xl font-bold text-primary">
                      ${shoppingList.totalCost.toFixed(2)}
                    </p>
                  </div>
                  <Button variant="outline" onClick={generateList} size="sm">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>

                <div className="space-y-4">
                  {Object.entries(shoppingList.categories).map(([category, items]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-3 text-lg capitalize">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {items.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Checkbox
                              id={`item-${category}-${index}`}
                              checked={checkedItems.has(item)}
                              onCheckedChange={() => toggleItem(item)}
                            />
                            <Label
                              htmlFor={`item-${category}-${index}`}
                              className={`flex-1 cursor-pointer ${
                                checkedItems.has(item) ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {item}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={downloadAsTxt} variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download TXT
                  </Button>
                  <Button onClick={downloadAsCsv} variant="outline" className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* Calendar Export Tab */}
          <TabsContent value="calendar" className="space-y-4 mt-4">
            <div className="text-center py-8">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold text-lg mb-2">Export to Calendar</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Download an .ics file with your meal plan. Each meal will be added as an event
                with prep reminders 30 minutes before.
              </p>
              <Button onClick={exportToCalendar} size="lg">
                <Download className="mr-2 h-4 w-4" />
                Download Calendar File (.ics)
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Import this file to Google Calendar, Outlook, Apple Calendar, or any calendar app
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
