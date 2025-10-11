import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Calendar, DollarSign } from "lucide-react";

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

interface SpecialistModalProps {
  specialist: Specialist | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SpecialistModal = ({ specialist, isOpen, onClose }: SpecialistModalProps) => {
  if (!specialist) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-montserrat font-bold">
            {specialist.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="text-6xl">{specialist.image}</div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-primary mb-2">{specialist.title}</p>
              <p className="text-muted-foreground mb-3">{specialist.specialty}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-semibold">{specialist.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <span className="font-semibold">${specialist.price}/session</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-montserrat font-bold text-xl mb-3">About</h3>
            <p className="text-muted-foreground leading-relaxed">{specialist.bio}</p>
          </div>

          <div>
            <h3 className="font-montserrat font-bold text-xl mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Availability
            </h3>
            <p className="text-muted-foreground">{specialist.availability}</p>
          </div>

          <div>
            <h3 className="font-montserrat font-bold text-xl mb-4">Patient Reviews</h3>
            <div className="space-y-4">
              {specialist.reviews.map((review, idx) => (
                <div key={idx} className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">{review.author}</span>
                    <div className="flex">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full bg-gradient-primary shadow-glow hover:scale-105 transition-transform">
            Book Consultation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
