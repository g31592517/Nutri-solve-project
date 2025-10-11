import { useState } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import About from "@/components/About";
import AIChat from "@/components/AIChat";
import Community from "@/components/Community";
import HealthDashboard from "@/components/HealthDashboard";
import EducationalResources from "@/components/EducationalResources";
import WeeklyMealPlanner from "@/components/WeeklyMealPlanner";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { SpecialistsSection } from "@/components/specialists/SpecialistsSection";
import { PricingSection } from "@/components/pricing/PricingSection";
import { AuthModal } from "@/components/auth/AuthModal";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState<"signin" | "signup">("signin");

  const handleOpenAuth = (tab: "signin" | "signup" = "signin") => {
    setAuthDefaultTab(tab);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background font-inter">
      <Navigation onOpenAuth={handleOpenAuth} />
      <main>
        <Hero />
        <Features />
        <About />
        <SpecialistsSection />
        <PricingSection onOpenAuth={handleOpenAuth} />
        <AIChat onOpenAuth={handleOpenAuth} />
        <Community onOpenAuth={handleOpenAuth} />
        <HealthDashboard />
        <EducationalResources />
        <WeeklyMealPlanner />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authDefaultTab}
      />
    </div>
  );
};

export default Index;
