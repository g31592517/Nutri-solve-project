import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const AIChat = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 font-inter font-medium">
              <MessageCircle className="h-4 w-4" />
              <span>AI Assistant</span>
            </div>
            <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
              Get Instant{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Nutrition Advice
              </span>
            </h2>
            <p className="font-inter text-lg text-muted-foreground">
              Chat with our AI-powered nutrition assistant for personalized
              recommendations
            </p>
          </div>

          <Card className="border-2 shadow-elegant bg-gradient-card">
            <CardContent className="p-6">
              <div className="space-y-4 mb-6 min-h-[300px] max-h-[400px] overflow-y-auto">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                    <p className="font-inter text-foreground">
                      Hello! I'm your AI nutrition assistant. How can I help you
                      today? Whether you're looking for meal ideas, nutrition
                      advice, or have questions about your diet, I'm here to
                      assist!
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-none px-4 py-3 max-w-[80%]">
                    <p className="font-inter">
                      I'm looking for healthy breakfast options that are quick to
                      prepare.
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    👤
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 max-w-[80%]">
                    <p className="font-inter text-foreground">
                      Great choice! Here are some quick and nutritious breakfast
                      options:
                      <br />
                      <br />
                      • Overnight oats with berries and nuts
                      <br />
                      • Greek yogurt parfait with granola
                      <br />
                      • Whole grain toast with avocado and eggs
                      <br />
                      <br />
                      Would you like detailed recipes for any of these?
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  className="flex-1 font-inter border-2 focus-visible:ring-primary"
                />
                <Button
                  size="icon"
                  className="bg-gradient-primary shadow-glow hover:scale-105 transition-transform"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AIChat;
