import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { SpecialistModal } from "./SpecialistModal";

interface Specialist {
  id: number;
  name: string;
  title: string;
  specialty: string;
  rating: number;
  price: number;
  availability: string;
  image: string;
  bio: string;
  reviews: Array<{ author: string; rating: number; comment: string }>;
}

const specialists: Specialist[] = [
  {
    id: 1,
    name: "Dr. Emily Carter",
    title: "Clinical Nutritionist",
    specialty: "Clinical nutritionist focusing on evidence-based plans for weight, allergies, and gut health.",
    rating: 4.9,
    price: 60,
    availability: "Mon 10:00, Tue 14:00, Thu 09:00",
    image: "👩‍⚕️",
    bio: "Dr. Emily Carter has over 15 years of experience in clinical nutrition, specializing in personalized dietary plans for weight management, food allergies, and digestive health. She holds a PhD in Nutritional Science and is a certified member of the Academy of Nutrition and Dietetics.",
    reviews: [
      { author: "Sarah M.", rating: 5, comment: "Dr. Carter helped me finally understand my gut issues. Her approach is thorough and compassionate." },
      { author: "John D.", rating: 5, comment: "Lost 20 lbs following her evidence-based plan. Highly recommend!" },
      { author: "Lisa P.", rating: 5, comment: "Professional, knowledgeable, and truly cares about her patients." },
    ],
  },
  {
    id: 2,
    name: "James Lee, RD",
    title: "Sports Dietitian",
    specialty: "Sports dietitian helping optimize performance, recovery, and lean mass.",
    rating: 4.7,
    price: 50,
    availability: "Wed 11:00, Fri 15:30",
    image: "👨‍💼",
    bio: "James Lee is a registered dietitian specializing in sports nutrition with a focus on athletic performance optimization. He has worked with professional athletes and fitness enthusiasts to achieve their nutritional goals while maintaining peak performance.",
    reviews: [
      { author: "Mike T.", rating: 5, comment: "As an athlete, James's advice transformed my performance and recovery time." },
      { author: "Emma R.", rating: 4, comment: "Great insights on nutrition for endurance training." },
    ],
  },
  {
    id: 3,
    name: "Priya Sharma, MSc",
    title: "Allergy & Gut Health Specialist",
    specialty: "Allergy-safe meal planning and gut health support for everyday life.",
    rating: 4.8,
    price: 65,
    availability: "Tue 10:30, Thu 16:00",
    image: "👩‍🔬",
    bio: "Priya Sharma specializes in creating allergy-safe nutrition plans and gut health optimization. With a Master's degree in Nutritional Sciences, she helps clients navigate food sensitivities while maintaining a balanced, nutritious diet.",
    reviews: [
      { author: "Rachel W.", rating: 5, comment: "Priya helped me identify my food triggers and create a sustainable eating plan." },
      { author: "David K.", rating: 5, comment: "Her expertise in gut health is unmatched. Feeling better than ever!" },
    ],
  },
  {
    id: 4,
    name: "Dr. Michael Chen",
    title: "Pediatric Nutritionist",
    specialty: "Specialized in children's nutrition and healthy eating habits.",
    rating: 4.9,
    price: 70,
    availability: "Mon 14:00, Wed 10:00",
    image: "👨‍⚕️",
    bio: "Dr. Chen specializes in pediatric nutrition with 12 years of experience helping families establish healthy eating patterns for children of all ages.",
    reviews: [
      { author: "Anna L.", rating: 5, comment: "Helped my picky eater develop better food habits!" },
    ],
  },
];

export const SpecialistsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % specialists.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + specialists.length) % specialists.length);
  };

  const visibleSpecialists = [
    specialists[currentIndex],
    specialists[(currentIndex + 1) % specialists.length],
    specialists[(currentIndex + 2) % specialists.length],
  ];

  return (
    <section id="specialists" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
            Meet Our Nutrition{" "}
            <span className="gradient-text">
              Specialists
            </span>
          </h2>
          <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with certified experts for personalized guidance and support
          </p>
        </div>

        <div className="relative">
          <div className="grid md:grid-cols-3 gap-6">
            {visibleSpecialists.map((specialist, idx) => (
              <Card
                key={`${specialist.id}-${idx}`}
                className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-glow hover:scale-105 cursor-pointer bg-gradient-card group"
              >
                <CardContent className="p-6">
                  <div className="text-6xl mb-4 text-center transform group-hover:scale-110 transition-transform">
                    {specialist.image}
                  </div>
                  <h3 className="font-montserrat font-bold text-xl text-foreground mb-2">
                    {specialist.name}
                  </h3>
                  <p className="text-sm font-semibold text-primary mb-2">
                    {specialist.title}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {specialist.specialty}
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold">{specialist.rating}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-semibold text-primary">
                      ${specialist.price}/session
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {specialist.availability}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => setSelectedSpecialist(specialist)}
                  >
                    Read more →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 rounded-full shadow-elegant hover:shadow-glow"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 rounded-full shadow-elegant hover:shadow-glow"
            onClick={nextSlide}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <SpecialistModal
        specialist={selectedSpecialist}
        isOpen={!!selectedSpecialist}
        onClose={() => setSelectedSpecialist(null)}
      />
    </section>
  );
};
