import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PricingSectionProps {
  onOpenAuth: (tab?: "signin" | "signup") => void;
}

const plans = [
  {
    name: "Free",
    price: 0,
    period: "forever",
    features: [
      "Basic meal tracking",
      "Limited recipe access",
      "Community access",
      "Basic AI chat (5/day)",
    ],
  },
  {
    name: "Premium",
    price: 15,
    yearlyPrice: 144,
    period: "month",
    popular: true,
    features: [
      "Unlimited AI consultations",
      "Full recipe library",
      "Advanced tracking",
      "Personalized meal plans",
    ],
  },
  {
    name: "Pro",
    price: 31,
    yearlyPrice: 297,
    period: "month",
    features: [
      "Everything in Premium",
      "1-on-1 specialist sessions",
      "Custom meal plans",
      "Advanced analytics",
    ],
  },
];

export const PricingSection = ({ onOpenAuth }: PricingSectionProps) => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const { toast } = useToast();

  const handleSelectPlan = async (planName: string, price: number) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in or create an account to continue with payment.",
      });
      onOpenAuth("signup");
      return;
    }

    if (price === 0) {
      toast({
        title: "Free Plan Selected",
        description: "You're all set with the free plan!",
      });
      return;
    }

    toast({
      title: "Payment Processing",
      description: `Proceeding to payment for ${planName} plan...`,
    });
  };

  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
            Pricing &{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Budget Planning
            </span>
          </h2>
          <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Choose the plan that fits your needs and budget
          </p>

          <div className="inline-flex items-center gap-2 p-1 bg-background rounded-lg shadow-sm">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingPeriod === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={`px-6 py-2 rounded-md font-medium transition-all ${
                billingPeriod === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const displayPrice =
              billingPeriod === "yearly" && plan.yearlyPrice
                ? Math.floor(plan.yearlyPrice / 12)
                : plan.price;

            return (
              <Card
                key={index}
                className={`border-2 transition-all duration-300 hover:shadow-glow hover:scale-105 hover:-translate-y-2 ${
                  plan.popular
                    ? "border-primary shadow-elegant scale-105"
                    : "border-border hover:border-primary/50"
                } bg-gradient-card relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <CardTitle className="font-montserrat text-2xl">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-5xl font-bold">${displayPrice}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  {billingPeriod === "yearly" && plan.yearlyPrice && (
                    <p className="text-sm text-muted-foreground mt-2">
                      ${plan.yearlyPrice} billed annually
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-gradient-primary shadow-glow"
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSelectPlan(plan.name, displayPrice)}
                  >
                    {plan.price === 0 ? "Get Started Free" : `Start ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
