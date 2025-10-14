import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useGamification } from "@/contexts/GamificationContext";
import { chatApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MealLogModal } from "@/components/tracking/MealLogModal";

interface AIChatProps {
  onOpenAuth: (tab?: "signin" | "signup") => void;
}

interface Message {
  content: string;
  role: 'user' | 'ai';
}

const AIChat = ({ onOpenAuth }: AIChatProps) => {
  const { user, isAuthenticated } = useAuth();
  const { profile, getPersonalizedPrompt } = useUserProfile();
  const { logAction } = useGamification();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: "Hello! I'm your AI nutrition assistant. How can I help you today? Whether you're looking for meal ideas, nutrition advice, or have questions about your diet, I'm here to assist!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMealLog, setShowMealLog] = useState(false);
  const [showLogPrompt, setShowLogPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use the AI chat feature.",
      });
      onOpenAuth("signup");
      return;
    }

    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      // Add personalized context if available
      const personalizedPrompt = getPersonalizedPrompt();
      const messageWithContext = userMessage + personalizedPrompt;
      
      const response = await chatApi.sendMessage(messageWithContext);
      
      // Log action for gamification
      logAction({
        type: 'chat',
        timestamp: new Date().toISOString(),
        metadata: { message: userMessage },
      });
      
      // Add AI response
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: response.response || "Sorry, I couldn't generate a response." 
      }]);
      
      // Show meal log prompt after response
      setShowLogPrompt(true);
      setTimeout(() => setShowLogPrompt(false), 8000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
      
      // Remove the user message if failed
      setMessages(prev => prev.slice(0, -1));
      setInput(userMessage); // Restore the input
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-chat">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6 font-inter font-medium">
              <MessageCircle className="h-4 w-4" />
              <span>AI Assistant</span>
            </div>
            <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
              Get Instant{" "}
              <span className="gradient-text">
                Nutrition Advice
              </span>
            </h2>
            <p className="font-inter text-lg text-muted-foreground">
              Chat with our AI-powered nutrition assistant for personalized
              recommendations
            </p>
          </div>

          <Card className={`border-2 shadow-elegant bg-gradient-card relative ${!isAuthenticated ? 'opacity-75' : ''}`}>
            {!isAuthenticated && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                <div className="text-center space-y-4 p-8">
                  <Lock className="h-16 w-16 text-primary mx-auto" />
                  <h3 className="font-montserrat font-bold text-2xl">Sign In Required</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Please sign in or create an account to access the AI chat feature.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => onOpenAuth("signin")}>
                      Sign In
                    </Button>
                    <Button className="bg-gradient-primary shadow-glow" onClick={() => onOpenAuth("signup")}>
                      Create Account
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <CardContent className="p-6">
              <div className="space-y-4 mb-6 min-h-[300px] max-h-[400px] overflow-y-auto">
                {messages.map((message, index) => (
                  <div key={index} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                    {message.role === 'ai' && (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 max-w-[80%] ${
                      message.role === 'ai' 
                        ? 'bg-muted rounded-tl-none' 
                        : 'bg-primary text-primary-foreground rounded-tr-none'
                    }`}>
                      <p className="font-inter whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                        👤
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  className="flex-1 font-inter border-2 focus-visible:ring-primary"
                  disabled={!isAuthenticated || loading}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="bg-gradient-primary shadow-glow hover:scale-105 transition-transform"
                  disabled={!isAuthenticated || loading || !input.trim()}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </form>

              {/* Meal Log Prompt */}
              {showLogPrompt && isAuthenticated && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg border-2 border-primary/20 animate-fade-in">
                  <p className="text-sm mb-2">🍽️ Log this meal to build your streak?</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { setShowMealLog(true); setShowLogPrompt(false); }}>
                      Yes, Log It
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowLogPrompt(false)}>
                      Not Now
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <MealLogModal isOpen={showMealLog} onClose={() => setShowMealLog(false)} />
    </section>
  );
};

export default AIChat;
