import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Loader2, ChevronRight, ChevronLeft, CheckCircle, Clock } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { mealPlanApi } from "@/lib/api";
import { toast } from "sonner";
import { WeeklyMealPlan, DayPlan } from "@/types/meal-plan";

interface AutoGenerateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanGenerated: (plan: WeeklyMealPlan) => void;
}

export const AutoGenerateModal = ({ open, onOpenChange, onPlanGenerated }: AutoGenerateModalProps) => {
  const { profile, updateProfile } = useUserProfile();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState('');
  const [completedDays, setCompletedDays] = useState<DayPlan[]>([]);
  const [currentDay, setCurrentDay] = useState('');

  // Form state
  const [editedProfile, setEditedProfile] = useState({
    age: profile.age || 28,
    gender: profile.gender || 'female',
    weight: profile.weight || 65,
    activityLevel: profile.activityLevel || 'moderate',
    primaryGoal: profile.primaryGoal || 'weight_loss',
    dietaryRestrictions: profile.dietaryRestrictions || [],
  });

  const [budget, setBudget] = useState(profile.weeklyBudget || '50-100');
  const [preferences, setPreferences] = useState('');
  const [varietyMode, setVarietyMode] = useState<'consistent' | 'variety'>('variety');

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus('Initializing...');
    setCompletedDays([]);
    setCurrentDay('');
    
    try {
      // Use real Ollama/Gemma streaming generation
      await mealPlanApi.generatePlanStream(
        editedProfile,
        budget,
        preferences,
        varietyMode,
        // onProgress callback
        (data) => {
          if (data.type === 'status') {
            setGenerationStatus(data.message);
            setGenerationProgress(data.progress);
            
            // Extract current day from status message
            const dayMatch = data.message.match(/Generating (\w+)/);
            if (dayMatch) {
              setCurrentDay(dayMatch[1]);
            }
          } else if (data.type === 'day_complete') {
            setCompletedDays(prev => [...prev, data.day]);
            setGenerationProgress(data.progress);
            setGenerationStatus(`${data.day.day} completed! 🎉`);
            
            // Log real timing for each day
            console.log(`[Real Generation] ${data.day.day} completed with ${data.day.meals.length} meals from Gemma`);
          }
        },
        // onComplete callback
        (mealPlan) => {
          setGenerationStatus('Plan completed! 🎉');
          setGenerationProgress(100);
          onPlanGenerated(mealPlan);
          toast.success("Real meal plan generated successfully! 🎉");
          
          // Reset and close after a brief delay
          setTimeout(() => {
            setIsGenerating(false);
            setLoading(false);
            setStep(1);
            onOpenChange(false);
          }, 2000);
        },
        // onError callback
        (error) => {
          console.error('Real generation error:', error);
          toast.error(error || 'Failed to generate meal plan');
          setIsGenerating(false);
          setLoading(false);
        }
      );
    } catch (error: any) {
      console.error('Generate plan error:', error);
      toast.error(error.message || 'Failed to generate meal plan');
      setIsGenerating(false);
      setLoading(false);
    }
  };


  const goalLabels: Record<string, string> = {
    weight_loss: 'Weight Loss',
    muscle_gain: 'Muscle Gain',
    maintenance: 'Maintenance',
    general_health: 'General Health',
  };

  const activityLabels: Record<string, string> = {
    sedentary: 'Sedentary',
    light: 'Light Activity',
    moderate: 'Moderate Activity',
    active: 'Active',
    very_active: 'Very Active',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-montserrat">
            Auto-Generate Meal Plan
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {isGenerating ? 'Generating Plan...' : `Step ${step} of 3`}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Profile Summary */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-muted/50 p-4 rounded-lg border">
                <h3 className="font-semibold mb-2">Your Profile</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  ✨ Personalization active from your profile info
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={editedProfile.age}
                      onChange={(e) => setEditedProfile({ ...editedProfile, age: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={editedProfile.weight}
                      onChange={(e) => setEditedProfile({ ...editedProfile, weight: parseInt(e.target.value) })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={editedProfile.gender}
                      onValueChange={(value) => setEditedProfile({ ...editedProfile, gender: value as any })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="activity">Activity Level</Label>
                    <Select
                      value={editedProfile.activityLevel}
                      onValueChange={(value) => setEditedProfile({ ...editedProfile, activityLevel: value as any })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="very_active">Very Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="goal">Primary Goal</Label>
                    <Select
                      value={editedProfile.primaryGoal}
                      onValueChange={(value) => setEditedProfile({ ...editedProfile, primaryGoal: value as any })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight_loss">Weight Loss</SelectItem>
                        <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="general_health">General Health</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {editedProfile.dietaryRestrictions.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm">Dietary Restrictions</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {editedProfile.dietaryRestrictions.map((restriction) => (
                        <span
                          key={restriction}
                          className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
                        >
                          {restriction}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Dynamic Inputs */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div>
                <Label htmlFor="budget">Weekly Budget</Label>
                <Select value={budget} onValueChange={(value) => setBudget(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20-50">$20 - $50</SelectItem>
                    <SelectItem value="50-100">$50 - $100</SelectItem>
                    <SelectItem value="100-150">$100 - $150</SelectItem>
                    <SelectItem value="150+">$150+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="preferences">Special Preferences (Optional)</Label>
                <Textarea
                  id="preferences"
                  placeholder="E.g., prefer light dinners, avoid eggs on weekends, quick breakfasts..."
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="variety">Meal Variety Mode</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {varietyMode === 'consistent'
                      ? 'Keep meals consistent (meal prep friendly)'
                      : 'Try new meals each day (maximize variety)'}
                  </p>
                </div>
                <Switch
                  id="variety"
                  checked={varietyMode === 'variety'}
                  onCheckedChange={(checked) => setVarietyMode(checked ? 'variety' : 'consistent')}
                />
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && !isGenerating && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="bg-muted/50 p-4 rounded-lg border">
                <h3 className="font-semibold mb-3">Confirm Your Plan Settings</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Profile:</span>{' '}
                    {editedProfile.age}yo {editedProfile.gender}, {editedProfile.weight}kg
                  </p>
                  <p>
                    <span className="text-muted-foreground">Activity:</span>{' '}
                    {activityLabels[editedProfile.activityLevel || 'moderate']}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Goal:</span>{' '}
                    {goalLabels[editedProfile.primaryGoal || 'general_health']}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Budget:</span> ${budget}/week
                  </p>
                  {preferences && (
                    <p>
                      <span className="text-muted-foreground">Preferences:</span> {preferences}
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Variety:</span>{' '}
                    {varietyMode === 'variety' ? 'Maximize variety' : 'Keep consistent'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Click "Generate Plan" to create your personalized 7-day meal plan
              </p>
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Generating Your Meal Plan</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">
                  Creating personalized meals for each day of the week...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="h-2" />
                <p className="text-sm text-center text-muted-foreground">
                  {generationStatus}
                </p>
              </div>

              {/* Days Progress Grid */}
              <div className="grid grid-cols-7 gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                  const isCompleted = completedDays.some(d => d.day === day);
                  const isCurrent = currentDay === day;
                  
                  return (
                    <div
                      key={day}
                      className={`p-3 rounded-lg border text-center transition-all duration-300 ${
                        isCompleted
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : isCurrent
                          ? 'bg-primary/10 border-primary text-primary animate-pulse'
                          : 'bg-muted/30 border-muted text-muted-foreground'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : isCurrent ? (
                          <Clock className="h-4 w-4" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border-2 border-current opacity-30" />
                        )}
                        <span className="text-xs font-medium">{day.slice(0, 3)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Completed Days Preview */}
              {completedDays.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Completed Days:</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {completedDays.map((day) => (
                      <div key={day.day} className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-green-700">{day.day}</span>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          {day.totalCalories} kcal • {day.totalProtein}g protein • {day.meals.length} meals
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {!isGenerating && (
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || loading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            {step < 3 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : (
                  'Generate Plan'
                )}
              </Button>
            )}
          </div>
        )}

        {/* Generation Controls */}
        {isGenerating && (
          <div className="flex justify-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setIsGenerating(false);
                setLoading(false);
                setStep(3);
              }}
              className="text-muted-foreground"
            >
              Cancel Generation
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
