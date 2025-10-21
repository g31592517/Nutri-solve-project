import { useState, useEffect, useRef, memo } from "react";
import { MessageCircle, Send, Lock, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useGamification } from "@/contexts/GamificationContext";
import { chatApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MealLogModal } from "@/components/tracking/MealLogModal";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIChatProps {
  onOpenAuth: (tab?: "signin" | "signup") => void;
}

interface Message {
  content: string;
  role: 'user' | 'ai';
}

// Custom Markdown components with NutriSolve styling
const MarkdownComponents = {
  // Headings
  h1: ({ children }: any) => (
    <h1 className="text-xl font-bold font-montserrat mb-2 text-foreground">{children}</h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="text-lg font-semibold font-montserrat mb-2 text-foreground">{children}</h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="text-base font-semibold font-montserrat mb-1 text-foreground">{children}</h3>
  ),
  
  // Text formatting
  strong: ({ children }: any) => (
    <strong className="font-bold text-foreground">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-foreground">{children}</em>
  ),
  
  // Lists
  ul: ({ children }: any) => (
    <ul className="list-none space-y-1 my-2 ml-0">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside space-y-1 my-2 ml-4 text-foreground">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="flex items-start gap-2 text-foreground">
      <span className="text-primary mt-1.5 text-xs">•</span>
      <span className="flex-1">{children}</span>
    </li>
  ),
  
  // Paragraphs and line breaks
  p: ({ children }: any) => (
    <p className="mb-2 last:mb-0 text-foreground leading-relaxed break-words">{children}</p>
  ),
  br: () => <br className="my-1" />,
  
  // Links
  a: ({ href, children }: any) => (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 underline font-medium"
    >
      {children}
    </a>
  ),
  
  // Code
  code: ({ children }: any) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
      {children}
    </code>
  ),
  
  // Blockquotes
  blockquote: ({ children }: any) => (
    <blockquote className="border-l-4 border-primary pl-4 my-2 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  
  // Tables
  table: ({ children }: any) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse border border-border">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-muted">{children}</thead>
  ),
  tbody: ({ children }: any) => (
    <tbody>{children}</tbody>
  ),
  tr: ({ children }: any) => (
    <tr className="border-b border-border">{children}</tr>
  ),
  th: ({ children }: any) => (
    <th className="border border-border px-3 py-2 text-left font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }: any) => (
    <td className="border border-border px-3 py-2 text-foreground">
      {children}
    </td>
  ),
  
  // Horizontal rule
  hr: () => (
    <hr className="my-4 border-t border-border" />
  ),
};

// Memoized Markdown message component for better streaming performance
const MarkdownMessage = memo(({ content }: { content: string }) => (
  <div className="font-inter prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={MarkdownComponents}
    >
      {content}
    </ReactMarkdown>
  </div>
));

MarkdownMessage.displayName = 'MarkdownMessage';

const AIChat = ({ onOpenAuth }: AIChatProps) => {
  const { user, isAuthenticated } = useAuth();
  const { profile, getPersonalizedPrompt } = useUserProfile();
  const { logAction } = useGamification();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'ai',
      content: "Hello! I'm your **AI nutrition assistant**. How can I help you today? Whether you're looking for:\n\n• **Meal ideas** 🍽️\n• **Nutrition advice** 📊\n• **Diet questions** 🥗\n\nI'm here to assist! Feel free to ask me anything about nutrition and healthy eating.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMealLog, setShowMealLog] = useState(false);
  const [showLogPrompt, setShowLogPrompt] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTop = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Improved scroll behavior with user control detection
  const scrollToBottom = (force = false) => {
    if (!messagesEndRef.current || (!force && userHasScrolled && isStreaming)) return;
    
    messagesEndRef.current.scrollIntoView({ 
      behavior: isStreaming ? "instant" : "smooth",
      block: "end"
    });
  };

  // Throttled scroll handler to prevent excessive updates
  const handleScroll = () => {
    if (!chatContainerRef.current || !isStreaming) return;
    
    // Throttle scroll events for better performance
    if (scrollTimeoutRef.current) return;
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (!chatContainerRef.current) return;
      
      const container = chatContainerRef.current;
      const currentScrollTop = container.scrollTop;
      const maxScrollTop = container.scrollHeight - container.clientHeight;
      
      // Check if user scrolled up manually (not at bottom)
      const isAtBottom = Math.abs(maxScrollTop - currentScrollTop) < 10;
      
      if (currentScrollTop < lastScrollTop.current && !isAtBottom) {
        setUserHasScrolled(true);
      } else if (isAtBottom) {
        setUserHasScrolled(false);
      }
      
      lastScrollTop.current = currentScrollTop;
      scrollTimeoutRef.current = null;
    }, 100); // 100ms throttle
  };

  // Auto-scroll logic with streaming awareness
  useEffect(() => {
    if (!isStreaming) {
      // Always scroll to bottom when not streaming
      scrollToBottom(true);
      setUserHasScrolled(false);
    } else {
      // During streaming, only scroll if user hasn't manually scrolled
      scrollToBottom(false);
    }
  }, [messages, isStreaming]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

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
    setIsStreaming(false);

    try {
      // Add personalized context if available
      const personalizedPrompt = getPersonalizedPrompt();
      const messageWithContext = userMessage + personalizedPrompt;
      
      // Add placeholder AI message for streaming
      const aiMessageIndex = messages.length + 1;
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: '' // Start with empty content for smoother streaming
      }]);
      
      let responseText = '';
      setIsStreaming(true);
      setUserHasScrolled(false); // Reset scroll state for new response
      
      // Use streaming API with optimized updates
      await chatApi.sendMessageStream(
        messageWithContext,
        (chunk: string) => {
          // Batch updates to reduce re-renders and improve performance
          responseText += chunk;
          
          // Use requestAnimationFrame for smooth updates and reduce layout thrashing
          requestAnimationFrame(() => {
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[aiMessageIndex] = {
                role: 'ai',
                content: responseText
              };
              return newMessages;
            });
          });
        },
        (fullResponse: string) => {
          // Final complete response
          console.log(`[Frontend] Complete response assembled: ${fullResponse.length} chars`);
          setIsStreaming(false);
          
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[aiMessageIndex] = {
              role: 'ai',
              content: fullResponse || "Sorry, I couldn't generate a response."
            };
            return newMessages;
          });
          
          // Log action for gamification
          logAction({
            type: 'chat',
            timestamp: new Date().toISOString(),
            metadata: { message: userMessage, responseLength: fullResponse.length },
          });
          
          // Show meal log prompt after response
          setShowLogPrompt(true);
          setTimeout(() => setShowLogPrompt(false), 8000);
          
          setLoading(false);
        }
      );
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
      
      // Remove the user message if failed
      setMessages(prev => prev.slice(0, -1));
      setInput(userMessage); // Restore the input
      setLoading(false);
      setIsStreaming(false);
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
              <div 
                ref={chatContainerRef}
                onScroll={handleScroll}
                className="space-y-4 mb-6 min-h-[300px] max-h-[400px] overflow-y-auto"
                style={{ 
                  scrollBehavior: isStreaming ? 'auto' : 'smooth',
                  overflowAnchor: 'none' // Prevent scroll anchoring that causes jumps
                }}
              >
                {messages.map((message, index) => (
                  <div key={`message-${index}-${message.role}`} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
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
                      {message.role === 'ai' ? (
                        <MarkdownMessage content={message.content} />
                      ) : (
                        <p className="font-inter whitespace-pre-wrap text-primary-foreground">{message.content}</p>
                      )}
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
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">
                          AI is thinking... This may take up to 10 minutes for complex responses.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Scroll to bottom button - shows when user scrolled up during streaming */}
              {userHasScrolled && isStreaming && (
                <div className="absolute bottom-20 right-6 z-10">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full shadow-lg animate-fade-in"
                    onClick={() => {
                      setUserHasScrolled(false);
                      scrollToBottom(true);
                    }}
                  >
                    <ChevronDown className="h-4 w-4 mr-1" />
                    New messages
                  </Button>
                </div>
              )}

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
