import { Calendar, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const WeeklyMealPlanner = () => {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const meals = ["Breakfast", "Lunch", "Dinner"];

  return (
    <section id="meal-planner" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
            Weekly{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Meal Planner
            </span>
          </h2>
          <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
            Plan your meals for the week and stay on track with your nutrition goals
          </p>
        </div>

        <Card className="border-2 border-border shadow-elegant bg-gradient-card max-w-6xl mx-auto">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="font-montserrat text-2xl flex items-center gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                Your Weekly Plan
              </CardTitle>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Auto-Generate Plan
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="monday" className="w-full">
              <TabsList className="grid grid-cols-7 w-full mb-6">
                {days.map((day) => (
                  <TabsTrigger
                    key={day}
                    value={day.toLowerCase()}
                    className="text-xs sm:text-sm"
                  >
                    {day.slice(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {days.map((day) => (
                <TabsContent key={day} value={day.toLowerCase()} className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    {meals.map((meal) => (
                      <Card
                        key={meal}
                        className="border-2 border-dashed border-muted hover:border-primary/50 transition-all duration-300 cursor-pointer group"
                      >
                        <CardContent className="p-6 text-center">
                          <h4 className="font-montserrat font-semibold text-lg mb-4 text-foreground">
                            {meal}
                          </h4>
                          <div className="min-h-[100px] flex flex-col items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                            <Plus className="h-8 w-8 mb-2" />
                            <p className="text-sm">Drag a recipe here or click to browse</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Daily Nutrition Summary */}
                  <Card className="border-2 bg-muted/50">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Calories</p>
                          <p className="text-lg font-semibold">0</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Protein</p>
                          <p className="text-lg font-semibold">0g</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                          <p className="text-lg font-semibold">0g</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Fat</p>
                          <p className="text-lg font-semibold">0g</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 mt-6 pt-6 border-t">
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Export to Calendar
              </Button>
              <Button variant="outline">Generate Shopping List</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default WeeklyMealPlanner;
