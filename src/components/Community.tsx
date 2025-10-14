import { useState, useEffect } from "react";
import { MessageSquare, Users, TrendingUp, Award, Image, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CommentsModal } from "./community/CommentsModal";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useGamification } from "@/contexts/GamificationContext";
import { communityApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CommunityProps {
  onOpenAuth: (tab?: "signin" | "signup") => void;
}

const Community = ({ onOpenAuth }: CommunityProps) => {
  const { isAuthenticated } = useAuth();
  const { profile } = useUserProfile();
  const { logAction, gamification, updateChallengeProgress } = useGamification();
  const { toast } = useToast();
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: "all", label: "All Topics" },
    { id: "allergies", label: "Allergy Support" },
    { id: "budget", label: "Budget Nutrition" },
    { id: "weight", label: "Weight Journey" },
    { id: "recipes", label: "Recipe Exchange" },
    { id: "qa", label: "Expert Q&A" },
  ];

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  const loadPosts = async () => {
    try {
      const response = await communityApi.getPosts(selectedCategory !== 'all' ? selectedCategory : undefined);
      if (response.success) {
        setPosts(response.posts);
      }
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a post.",
      });
      onOpenAuth("signup");
      return;
    }

    if (!newPostContent.trim()) {
      toast({
        title: "Error",
        description: "Post content cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await communityApi.createPost(newPostContent, selectedCategory);
      if (response.success) {
        // Log action for gamification
        logAction({
          type: 'community_post',
          timestamp: new Date().toISOString(),
          metadata: { category: selectedCategory },
        });
        
        toast({
          title: "Success",
          description: "Your post has been created!",
        });
        setNewPostContent("");
        loadPosts();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to like posts.",
      });
      onOpenAuth("signup");
      return;
    }

    try {
      await communityApi.likePost(postId);
      loadPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to like post",
        variant: "destructive",
      });
    }
  };

  const handleViewComments = (post: any) => {
    setSelectedPost(post);
    setShowCommentsModal(true);
  };

  const getUserBadges = (userId: string) => {
    // In a real app, this would come from the user's profile
    // For now, show current user's badges
    return gamification.badges.slice(0, 2);
  };

  return (
    <section id="community" className="py-20 bg-gradient-community">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-montserrat font-bold text-4xl md:text-5xl text-foreground mb-4">
            Community{" "}
            <span className="gradient-text">
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
              variant={category.id === selectedCategory ? "default" : "outline"}
              className="animate-fade-in"
              onClick={() => setSelectedCategory(category.id)}
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
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                />
                <div className="flex justify-between items-center">
                  <Button variant="outline" size="sm" disabled>
                    <Image className="mr-2 h-4 w-4" />
                    Add Image (Coming Soon)
                  </Button>
                  <Button size="sm" onClick={handleCreatePost} disabled={loading || !newPostContent.trim()}>
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? "Posting..." : "Share Post"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Posts */}
            {posts.length === 0 ? (
              <Card className="border-2 shadow-elegant">
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post, index) => (
                <Card key={post._id} className="border-2 hover:border-primary/50 transition-all duration-300 shadow-elegant animate-fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {post.avatar ? (
                          <span className="font-semibold text-primary">{post.avatar}</span>
                        ) : (
                          <Users className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-montserrat font-semibold text-foreground">{post.author}</h4>
                          {getUserBadges(post.authorId).map((badge) => (
                            <Badge key={badge.id} variant="secondary" className="text-xs">
                              {badge.icon}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(post.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <button 
                        className="hover:text-primary transition-colors flex items-center gap-1 font-semibold"
                        onClick={() => handleViewComments(post)}
                      >
                        <MessageSquare className="h-4 w-4" />
                        {post.comments?.length || 0} Comments
                      </button>
                      <button 
                        className="hover:text-primary transition-colors flex items-center gap-1"
                        onClick={() => handleLikePost(post._id)}
                      >
                        👏 {post.likes || 0} Likes
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
                  {gamification.challenges.slice(0, 2).map((challenge) => (
                    <div key={challenge.id}>
                      <h5 className="font-semibold text-foreground mb-2">{challenge.name}</h5>
                      <p className="text-sm text-muted-foreground mb-3">
                        {challenge.description}
                      </p>
                      <div className="mb-2">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {challenge.progress}/{challenge.target} {challenge.type === 'daily' ? 'days' : 'completed'}
                        </p>
                      </div>
                      {challenge.progress === 0 ? (
                        <Button size="sm" className="w-full" onClick={() => updateChallengeProgress(challenge.id, 1)}>
                          Join Challenge
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full">
                          {Math.round((challenge.progress / challenge.target) * 100)}% Complete
                        </Button>
                      )}
                    </div>
                  ))}
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
        initialComments={selectedPost?.comments || []}
      />
    </section>
  );
};

export default Community;
