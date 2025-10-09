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

const Index = () => {
  return (
    <div className="min-h-screen bg-background font-inter">
      <Navigation />
      <main>
        <Hero />
        <Features />
        <About />
        <AIChat />
        <Community />
        <HealthDashboard />
        <EducationalResources />
        <WeeklyMealPlanner />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
