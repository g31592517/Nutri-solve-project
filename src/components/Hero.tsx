import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onOpenAuth?: (tab?: "signin" | "signup") => void;
}

const Hero = ({ onOpenAuth }: HeroProps) => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden pt-20"
    >
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 animate-fade-in font-inter">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">AI-Powered Nutrition Platform</span>
          </div>

          <h1 className="font-montserrat font-bold text-5xl md:text-7xl text-foreground mb-6 animate-fade-up">
            Transform Your{" "}
            <span className="gradient-text">
              Nutrition Journey
            </span>
          </h1>

          <p className="font-inter text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Empowering sustainable wellness through personalized nutrition plans,
            expert insights, and community support. Transform your nutrition
            challenges into achievable triumphs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <Button
              size="lg"
              onClick={() => onOpenAuth?.("signup")}
              className="bg-gradient-primary font-inter font-semibold text-lg px-8 py-6 shadow-glow hover:scale-105 transition-transform group"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-inter font-semibold text-lg px-8 py-6 border-2 hover:border-primary hover:text-primary"
            >
              Learn More
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="text-center">
              <div className="font-montserrat font-bold text-3xl md:text-4xl text-primary mb-2">
                10K+
              </div>
              <div className="font-inter text-sm text-muted-foreground">
                Active Users
              </div>
            </div>
            <div className="text-center">
              <div className="font-montserrat font-bold text-3xl md:text-4xl text-primary mb-2">
                95%
              </div>
              <div className="font-inter text-sm text-muted-foreground">
                Success Rate
              </div>
            </div>
            <div className="text-center">
              <div className="font-montserrat font-bold text-3xl md:text-4xl text-primary mb-2">
                24/7
              </div>
              <div className="font-inter text-sm text-muted-foreground">
                AI Support
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
