import { Lightbulb, GraduationCap, Calculator, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const EducationalResources = () => {
  const resources = [
    {
      icon: Lightbulb,
      title: "Myth Busters",
      description: "Separate fact from fiction with evidence-based nutrition information",
      action: "Explore Myths",
      color: "bg-primary/10 text-primary",
    },
    {
      icon: GraduationCap,
      title: "Nutrition Basics",
      description: "Learn fundamental nutrition concepts and principles",
      action: "Start Learning",
      color: "bg-secondary/10 text-secondary",
    },
    {
      icon: Calculator,
      title: "Health Calculators",
      description: "Calculate BMI, BMR, and other health metrics",
      action: "Calculate Now",
      color: "bg-accent/10 text-accent",
    },
  ];

  const myths = [
    {
      question: "Are carbs bad for weight loss?",
      answer: "No! Carbohydrates are essential nutrients. The key is choosing complex carbs like whole grains, fruits, and vegetables over refined carbs. Quality and portion size matter more than elimination.",
    },
    {
      question: "Does eating late at night cause weight gain?",
      answer: "Weight gain is about total calorie intake versus expenditure, not timing. However, late-night snacking can lead to consuming excess calories. Focus on your overall daily intake.",
    },
    {
      question: "Do I need to eat breakfast to lose weight?",
      answer: "While breakfast can help some people manage hunger, it's not mandatory for weight loss. What matters most is total daily calorie intake and finding an eating pattern that works for you.",
    },
    {
      question: "Are all fats unhealthy?",
      answer: "Absolutely not! Healthy fats from sources like avocados, nuts, olive oil, and fatty fish are essential for hormone production, nutrient absorption, and overall health.",
    },
  ];

  return (
    <section id="educational" className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
            Educational{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Resources
            </span>
          </h2>
          <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn from evidence-based content and interactive tools
          </p>
        </div>

        {/* Resource Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <Card
                key={index}
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-elegant bg-gradient-card group animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 rounded-lg ${resource.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-montserrat font-bold text-xl text-foreground mb-3">
                    {resource.title}
                  </h3>
                  <p className="font-inter text-muted-foreground mb-6">
                    {resource.description}
                  </p>
                  <Button className="w-full">{resource.action}</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Myth Busters Section */}
        <Card className="border-2 bg-gradient-card shadow-elegant max-w-4xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h3 className="font-montserrat font-bold text-2xl md:text-3xl text-foreground mb-2">
                Common Nutrition Myths
              </h3>
              <p className="text-muted-foreground">
                Get the facts behind popular nutrition misconceptions
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              {myths.map((myth, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border-2 border-border rounded-lg px-6 data-[state=open]:border-primary/50 transition-all duration-300"
                >
                  <AccordionTrigger className="font-montserrat font-semibold text-left hover:text-primary">
                    {myth.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    {myth.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default EducationalResources;
