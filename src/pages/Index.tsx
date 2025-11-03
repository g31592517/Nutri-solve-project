import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import About from "@/components/About";
import AIChat from "@/components/aiChatComponent";
import Community from "@/components/Community";
import HealthDashboard from "@/components/healthDashboardComponent";
import EducationalResources from "@/components/EducationalResources";
import EnhancedWeeklyMealPlanner from "@/components/meal-plan/EnhancedWeeklyMealPlanner";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { SpecialistsSection } from "@/components/specialists/SpecialistsSection";
import { PricingSection } from "@/components/pricing/PricingSection";
import { AuthModal } from "@/components/auth/userAuthModal";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"signin" | "signup">("signin");
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { profile } = useUserProfile();

  // Show onboarding after successful auth if not completed
  useEffect(() => {
    if (isAuthenticated && !profile.onboardingCompleted) {
      // Delay slightly to allow auth modal to close
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, profile.onboardingCompleted]);

  const handleOpenAuth = (tab: "signin" | "signup" = "signin") => {
    setAuthDefaultTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleAuthClose = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navigation onOpenAuth={handleOpenAuth} />
      <main>
        <Hero onOpenAuth={handleOpenAuth} />
        <Features />
        <About />
        <SpecialistsSection />
        <PricingSection onOpenAuth={handleOpenAuth} />
        <AIChat onOpenAuth={handleOpenAuth} />
        <Community onOpenAuth={handleOpenAuth} />
        <HealthDashboard />
        <EducationalResources />
        <EnhancedWeeklyMealPlanner />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={handleAuthClose}
        defaultTab={authDefaultTab}
      />
      <OnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};

export default Index;
