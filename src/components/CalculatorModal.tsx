import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Info } from "lucide-react";

interface CalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CalculatorModal = ({ isOpen, onClose }: CalculatorModalProps) => {
  const { profile } = useUserProfile();
  const [bmiWeight, setBmiWeight] = useState("");
  const [bmiHeight, setBmiHeight] = useState("");
  const [bmiResult, setBmiResult] = useState<number | null>(null);

  const [bmrWeight, setBmrWeight] = useState("");
  const [bmrHeight, setBmrHeight] = useState("");
  const [bmrAge, setBmrAge] = useState("");
  const [bmrGender, setBmrGender] = useState("male");
  const [bmrResult, setBmrResult] = useState<number | null>(null);

  // Pre-fill with profile data when modal opens
  useEffect(() => {
    if (isOpen && profile.onboardingCompleted) {
      if (profile.weight) {
        setBmiWeight(profile.weight.toString());
        setBmrWeight(profile.weight.toString());
      }
      if (profile.height) {
        setBmiHeight(profile.height.toString());
        setBmrHeight(profile.height.toString());
      }
      if (profile.age) {
        setBmrAge(profile.age.toString());
      }
      if (profile.gender && (profile.gender === 'male' || profile.gender === 'female')) {
        setBmrGender(profile.gender);
      }
    }
  }, [isOpen, profile]);

  const calculateBMI = () => {
    const weight = parseFloat(bmiWeight);
    const height = parseFloat(bmiHeight) / 100; // Convert cm to meters

    if (weight > 0 && height > 0) {
      const bmi = weight / (height * height);
      setBmiResult(Math.round(bmi * 10) / 10);
    }
  };

  const calculateBMR = () => {
    const weight = parseFloat(bmrWeight);
    const height = parseFloat(bmrHeight);
    const age = parseFloat(bmrAge);

    if (weight > 0 && height > 0 && age > 0) {
      let bmr: number;
      
      if (bmrGender === "male") {
        // Mifflin-St Jeor Equation for men
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        // Mifflin-St Jeor Equation for women
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
      
      setBmrResult(Math.round(bmr));
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: "Underweight", color: "text-blue-600" };
    if (bmi < 25) return { category: "Normal weight", color: "text-green-600" };
    if (bmi < 30) return { category: "Overweight", color: "text-yellow-600" };
    return { category: "Obese", color: "text-red-600" };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-montserrat font-bold text-2xl">
            Health Calculators
          </DialogTitle>
          <DialogDescription>
            {profile.onboardingCompleted ? (
              <span className="flex items-center gap-2 text-sm text-primary">
                <Info className="h-4 w-4" />
                Pre-filled with your profile data
              </span>
            ) : (
              "Calculate your BMI and BMR to track your health metrics"
            )}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="bmi" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bmi">BMI Calculator</TabsTrigger>
            <TabsTrigger value="bmr">BMR Calculator</TabsTrigger>
          </TabsList>

          <TabsContent value="bmi" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="bmi-weight">Weight (kg)</Label>
                <Input
                  id="bmi-weight"
                  type="number"
                  placeholder="70"
                  value={bmiWeight}
                  onChange={(e) => setBmiWeight(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="bmi-height">Height (cm)</Label>
                <Input
                  id="bmi-height"
                  type="number"
                  placeholder="175"
                  value={bmiHeight}
                  onChange={(e) => setBmiHeight(e.target.value)}
                />
              </div>

              <Button onClick={calculateBMI} className="w-full">
                Calculate BMI
              </Button>

              {bmiResult !== null && (
                <div className="mt-6 p-6 bg-gradient-card rounded-lg border-2">
                  <h4 className="font-montserrat font-bold text-xl mb-2">Your BMI</h4>
                  <p className="text-4xl font-bold text-primary mb-2">{bmiResult}</p>
                  <p className={`text-lg font-semibold ${getBMICategory(bmiResult).color}`}>
                    {getBMICategory(bmiResult).category}
                  </p>
                  <div className="mt-4 text-sm text-muted-foreground space-y-1">
                    <p>• Underweight: BMI less than 18.5</p>
                    <p>• Normal weight: BMI 18.5–24.9</p>
                    <p>• Overweight: BMI 25–29.9</p>
                    <p>• Obese: BMI 30 or greater</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bmr" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label>Gender</Label>
                <RadioGroup value={bmrGender} onValueChange={setBmrGender}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="bmr-weight">Weight (kg)</Label>
                <Input
                  id="bmr-weight"
                  type="number"
                  placeholder="70"
                  value={bmrWeight}
                  onChange={(e) => setBmrWeight(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="bmr-height">Height (cm)</Label>
                <Input
                  id="bmr-height"
                  type="number"
                  placeholder="175"
                  value={bmrHeight}
                  onChange={(e) => setBmrHeight(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="bmr-age">Age (years)</Label>
                <Input
                  id="bmr-age"
                  type="number"
                  placeholder="30"
                  value={bmrAge}
                  onChange={(e) => setBmrAge(e.target.value)}
                />
              </div>

              <Button onClick={calculateBMR} className="w-full">
                Calculate BMR
              </Button>

              {bmrResult !== null && (
                <div className="mt-6 p-6 bg-gradient-card rounded-lg border-2">
                  <h4 className="font-montserrat font-bold text-xl mb-2">Your BMR</h4>
                  <p className="text-4xl font-bold text-primary mb-2">{bmrResult} cal/day</p>
                  <p className="text-sm text-muted-foreground mt-4">
                    Your Basal Metabolic Rate (BMR) is the number of calories your body needs to
                    maintain basic physiological functions at rest.
                  </p>
                  <div className="mt-4 space-y-2 text-sm">
                    <p className="font-semibold">Daily Calorie Needs by Activity Level:</p>
                    <div className="space-y-1 text-muted-foreground">
                      <p>• Sedentary (little/no exercise): {Math.round(bmrResult * 1.2)} cal</p>
                      <p>• Light (1-3 days/week): {Math.round(bmrResult * 1.375)} cal</p>
                      <p>• Moderate (3-5 days/week): {Math.round(bmrResult * 1.55)} cal</p>
                      <p>• Active (6-7 days/week): {Math.round(bmrResult * 1.725)} cal</p>
                      <p>• Very Active (intense daily): {Math.round(bmrResult * 1.9)} cal</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
