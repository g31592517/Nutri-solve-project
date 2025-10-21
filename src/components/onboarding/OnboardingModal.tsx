import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { UserProfile } from "@/types/user";
import { ChevronRight, ChevronLeft, User, Target, Heart } from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useToast } from "@/hooks/use-toast";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const dietaryOptions = [
  'vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'nut_allergy',
  'soy_free', 'egg_free', 'shellfish_allergy', 'halal', 'kosher'
];

const cuisineOptions = [
  'italian', 'asian', 'mexican', 'mediterranean', 'indian',
  'american', 'middle_eastern', 'african', 'caribbean'
];

export const OnboardingModal = ({ isOpen, onClose }: OnboardingModalProps) => {
  const { completeOnboarding } = useUserProfile();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserProfile>({});

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      completeOnboarding(formData);
      toast({
        title: "Profile Complete!",
        description: "Your personalized experience is ready.",
      });
      onClose();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSkip = () => {
    completeOnboarding({ ...formData, onboardingCompleted: true });
    onClose();
  };

  const updateFormData = (updates: Partial<UserProfile>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (array: string[] | undefined, item: string) => {
    if (!array) return [item];
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.age && formData.gender && formData.height && formData.weight && formData.activityLevel;
    }
    if (step === 2) {
      return formData.primaryGoal;
    }
    return true; // Step 3 is optional
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-montserrat font-bold flex items-center gap-2">
            {step === 1 && <><User className="h-6 w-6 text-primary" /> Build Your Profile</>}
            {step === 2 && <><Target className="h-6 w-6 text-primary" /> Your Goals</>}
            {step === 3 && <><Heart className="h-6 w-6 text-primary" /> Your Preferences</>}
          </DialogTitle>
          <DialogDescription>
            Help us personalize your NutriSolve experience
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Basic Profile */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={formData.age || ''}
                  onChange={(e) => updateFormData({ age: parseInt(e.target.value) || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(value: any) => updateFormData({ gender: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="height">Height (cm) *</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="170"
                  value={formData.height || ''}
                  onChange={(e) => updateFormData({ height: parseInt(e.target.value) || undefined })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="70"
                  value={formData.weight || ''}
                  onChange={(e) => updateFormData({ weight: parseInt(e.target.value) || undefined })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="activityLevel">Activity Level *</Label>
              <Select value={formData.activityLevel} onValueChange={(value: any) => updateFormData({ activityLevel: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (little to no exercise)</SelectItem>
                  <SelectItem value="light">Light (exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="moderate">Moderate (exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="active">Active (exercise 6-7 days/week)</SelectItem>
                  <SelectItem value="very_active">Very Active (intense exercise daily)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Goals & Restrictions */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label htmlFor="primaryGoal">Primary Goal *</Label>
              <Select value={formData.primaryGoal} onValueChange={(value: any) => updateFormData({ primaryGoal: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select your goal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="general_health">General Health</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Dietary Restrictions (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {dietaryOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={formData.dietaryRestrictions?.includes(option)}
                      onCheckedChange={() => updateFormData({
                        dietaryRestrictions: toggleArrayItem(formData.dietaryRestrictions, option)
                      })}
                    />
                    <label
                      htmlFor={option}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="weeklyBudget">Weekly Food Budget</Label>
              <Select value={formData.weeklyBudget} onValueChange={(value: any) => updateFormData({ weeklyBudget: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20-50">$20-50</SelectItem>
                  <SelectItem value="50-100">$50-100</SelectItem>
                  <SelectItem value="100-150">$100-150</SelectItem>
                  <SelectItem value="150+">$150+</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label>Favorite Cuisines (select all that apply)</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {cuisineOptions.map((cuisine) => (
                  <div key={cuisine} className="flex items-center space-x-2">
                    <Checkbox
                      id={cuisine}
                      checked={formData.favoriteCuisines?.includes(cuisine)}
                      onCheckedChange={() => updateFormData({
                        favoriteCuisines: toggleArrayItem(formData.favoriteCuisines, cuisine)
                      })}
                    />
                    <label
                      htmlFor={cuisine}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {cuisine.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="mealFrequency">Meal Frequency</Label>
              <Select value={formData.mealFrequency} onValueChange={(value: any) => updateFormData({ mealFrequency: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select meal frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3_meals">3 Meals/Day</SelectItem>
                  <SelectItem value="intermittent_fasting">Intermittent Fasting</SelectItem>
                  <SelectItem value="5_small_meals">5 Small Meals</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-primary/10 p-4 rounded-lg">
              <p className="text-sm text-foreground">
                <strong>Almost done!</strong> This information will help us provide personalized recommendations, 
                filter relevant community content, and pre-fill health calculators.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleSkip}>
              Skip
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-gradient-primary shadow-glow"
            >
              {step === totalSteps ? 'Complete' : 'Next'}
              {step < totalSteps && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
