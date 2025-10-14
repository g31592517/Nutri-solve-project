import { Brain, Users, BarChart3, Apple, Clock, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description:
        "Advanced algorithms analyze your dietary needs and create personalized nutrition plans tailored to your goals.",
    },
    {
      icon: Apple,
      title: "Custom Meal Plans",
      description:
        "Get delicious, nutritious meal recommendations based on your preferences, allergies, and health objectives.",
    },
    {
      icon: BarChart3,
      title: "Progress Tracking",
      description:
        "Monitor your nutrition journey with detailed analytics and insights to keep you motivated.",
    },
    {
      icon: Users,
      title: "Community Support",
      description:
        "Connect with others, share experiences, and get inspired on your wellness journey.",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description:
        "Access your nutrition guidance anytime, anywhere with our AI-powered chat assistant.",
    },
    {
      icon: Shield,
      title: "Expert Verified",
      description:
        "All recommendations are backed by nutritional science and verified by certified dietitians.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
            Powerful Features for{" "}
            <span className="gradient-text">
              Better Health
            </span>
          </h2>
          <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to achieve your nutrition goals in one intelligent platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card
                key={index}
                className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-elegant bg-gradient-card animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-300">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-montserrat font-bold text-xl text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="font-inter text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
