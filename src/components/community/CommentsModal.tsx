import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Heart, MessageCircle } from "lucide-react";

interface Comment {
  id: number;
  author: string;
  avatar: string;
  content: string;
  likes: number;
  timestamp: string;
}

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  postAuthor: string;
  postContent: string;
  initialComments: Comment[];
}

export const CommentsModal = ({
  isOpen,
  onClose,
  postAuthor,
  postContent,
  initialComments,
}: CommentsModalProps) => {
  const [comments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState("");

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      // Here you would typically add the comment to your backend
      setNewComment("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-montserrat font-bold">
            Comments
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Post */}
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <Avatar>
                <AvatarFallback>{postAuthor[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{postAuthor}</p>
              </div>
            </div>
            <p className="text-foreground/90">{postContent}</p>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{comment.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="font-semibold text-sm mb-1">{comment.author}</p>
                    <p className="text-sm text-foreground/80">{comment.content}</p>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Heart className="h-3 w-3" />
                      <span>{comment.likes}</span>
                    </button>
                    <button className="hover:text-primary transition-colors">Reply</button>
                    <span>{comment.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="border-t pt-4">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="mb-3"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
