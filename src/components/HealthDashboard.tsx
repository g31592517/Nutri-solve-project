import { Flame, Droplet, AppleIcon, Calendar, Utensils, Dumbbell, Weight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const HealthDashboard = () => {
  const progressRings = [
    { value: 75, label: "Calories", color: "text-primary", icon: Flame },
    { value: 60, label: "Protein", color: "text-secondary", icon: AppleIcon },
    { value: 90, label: "Water", color: "text-accent", icon: Droplet },
  ];

  const streaks = [
    { days: 7, label: "Days Logging Meals", icon: Flame },
    { days: 12, label: "Days Drinking Water", icon: Droplet },
    { days: 5, label: "Days Eating Vegetables", icon: AppleIcon },
  ];

  return (
    <section id="tracking" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
            Your Health{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Dashboard
            </span>
          </h2>
          <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
            Track progress, build habits, and achieve your nutrition goals
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Daily Progress */}
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 shadow-elegant bg-gradient-card">
            <CardHeader>
              <CardTitle className="font-montserrat text-xl">Daily Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-around items-center">
                {progressRings.map((ring) => {
                  const Icon = ring.icon;
                  return (
                    <div key={ring.label} className="flex flex-col items-center">
                      <div className="relative w-24 h-24 mb-2">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-muted"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - ring.value / 100)}`}
                            className={ring.color}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-bold">{ring.value}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon className={`h-4 w-4 ${ring.color}`} />
                        <span className="text-sm text-muted-foreground">{ring.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Current Streaks */}
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 shadow-elegant bg-gradient-card">
            <CardHeader>
              <CardTitle className="font-montserrat text-xl">Current Streaks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {streaks.map((streak) => {
                const Icon = streak.icon;
                return (
                  <div key={streak.label} className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">{streak.days}</span>
                        <span className="text-sm text-muted-foreground">{streak.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Weight Journey */}
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 shadow-elegant bg-gradient-card">
            <CardHeader>
              <CardTitle className="font-montserrat text-xl">Weight Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="h-32 bg-muted/50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Weight className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Chart visualization</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current</p>
                    <p className="text-lg font-semibold">165 lbs</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Goal</p>
                    <p className="text-lg font-semibold">160 lbs</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Lost</p>
                    <p className="text-lg font-semibold text-primary">-5 lbs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-2 bg-gradient-card shadow-elegant">
          <CardHeader>
            <CardTitle className="font-montserrat text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Utensils className="h-6 w-6" />
                <span>Log Meal</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Droplet className="h-6 w-6" />
                <span>Track Water</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Dumbbell className="h-6 w-6" />
                <span>Log Exercise</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                <Weight className="h-6 w-6" />
                <span>Update Weight</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default HealthDashboard;
