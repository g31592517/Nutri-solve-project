import { useState } from "react";
import { MessageSquare, Users, TrendingUp, Award, Image, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CommentsModal } from "./community/CommentsModal";

interface CommunityProps {
  onOpenAuth: (tab?: "signin" | "signup") => void;
}

const Community = ({ onOpenAuth }: CommunityProps) => {
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const categories = [
    { id: "all", label: "All Topics" },
    { id: "allergies", label: "Allergy Support" },
    { id: "budget", label: "Budget Nutrition" },
    { id: "weight", label: "Weight Journey" },
    { id: "recipes", label: "Recipe Exchange" },
    { id: "qa", label: "Expert Q&A" },
  ];

  const sampleComments = [
    { id: 1, author: "John D.", avatar: "JD", content: "Great job! Keep it up!", likes: 5, timestamp: "1 hour ago" },
    { id: 2, author: "Lisa P.", avatar: "LP", content: "Can you share your meal plan?", likes: 3, timestamp: "45 mins ago" },
    { id: 3, author: "Tom R.", avatar: "TR", content: "Inspiring! I'm starting today!", likes: 8, timestamp: "30 mins ago" },
  ];

  const handleViewComments = (post: any) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  return (
    <section id="community" className="py-20 bg-gradient-community">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
            Community{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Support Hub
            </span>
          </h2>
          <p className="font-inter text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect with others, share experiences, and get inspired on your nutrition journey
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={category.id === "all" ? "default" : "outline"}
              className="animate-fade-in"
            >
              {category.label}
            </Button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Creation */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 shadow-elegant">
              <CardContent className="p-6">
                <Textarea
                  placeholder="Share your nutrition journey, ask questions, or inspire others..."
                  className="min-h-[120px] mb-4 resize-none"
                />
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    <Image className="mr-2 h-4 w-4" />
                    Add Image
                  </Button>
                  <Button size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    Share Post
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sample Posts */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300 shadow-elegant animate-fade-up">
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-montserrat font-semibold text-foreground mb-1">Sarah M.</h4>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <p className="text-foreground mb-4">
                  Just completed my first week on the budget meal plan! Down 3 lbs and spent only $45. The AI suggestions really work! 🎉
                </p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <button 
                    className="hover:text-primary transition-colors flex items-center gap-1 font-semibold"
                    onClick={() => handleViewComments({
                      author: "Sarah M.",
                      content: "Just completed my first week on the budget meal plan! Down 3 lbs and spent only $45. The AI suggestions really work! 🎉"
                    })}
                  >
                    <MessageSquare className="h-4 w-4" />
                    24 Comments
                  </button>
                  <button className="hover:text-primary transition-colors">👏 48 Likes</button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all duration-300 shadow-elegant animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-montserrat font-semibold text-foreground mb-1">Mike T.</h4>
                    <p className="text-sm text-muted-foreground">5 hours ago</p>
                  </div>
                </div>
                <p className="text-foreground mb-4">
                  Anyone else managing nut allergies? Found some amazing substitutes in the recipe section. Happy to share my favorites!
                </p>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <button 
                    className="hover:text-primary transition-colors flex items-center gap-1 font-semibold"
                    onClick={() => handleViewComments({
                      author: "Mike T.",
                      content: "Anyone else managing nut allergies? Found some amazing substitutes in the recipe section. Happy to share my favorites!"
                    })}
                  >
                    <MessageSquare className="h-4 w-4" />
                    16 Comments
                  </button>
                  <button className="hover:text-primary transition-colors">👏 32 Likes</button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Active Challenges */}
            <Card className="border-2 bg-gradient-card shadow-elegant">
              <CardContent className="p-6">
                <h4 className="font-montserrat font-semibold text-lg mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Active Challenges
                </h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-semibold text-foreground mb-2">7-Day Healthy Breakfast Challenge</h5>
                    <p className="text-sm text-muted-foreground mb-3">
                      Start your day right with nutritious breakfasts
                    </p>
                    <div className="mb-2">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: "60%" }}></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">3/7 days completed</p>
                    </div>
                    <Button size="sm" className="w-full">Join Challenge</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trending Topics */}
            <Card className="border-2 bg-gradient-card shadow-elegant">
              <CardContent className="p-6">
                <h4 className="font-montserrat font-semibold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Trending Topics
                </h4>
                <div className="flex flex-wrap gap-2">
                  {["#MealPrep", "#BudgetFriendly", "#AllergySafe", "#WeightLoss", "#PlantBased"].map((tag) => (
                    <button
                      key={tag}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CommentsModal
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        postAuthor={selectedPost?.author || ""}
        postContent={selectedPost?.content || ""}
        initialComments={sampleComments}
      />
    </section>
  );
};

export default Community;
