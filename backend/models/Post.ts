import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  author: string;
  avatar: string;
  content: string;
  likes: number;
  timestamp: Date;
}

export interface IPost extends Document {
  author: string;
  userId: mongoose.Types.ObjectId;
  avatar: string;
  content: string;
  category?: string;
  likes: number;
  comments: IComment[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema({
  author: { type: String, required: true },
  avatar: { type: String, required: true },
  content: { type: String, required: true },
  likes: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

const PostSchema: Schema = new Schema(
  {
    author: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    avatar: { type: String, default: '' },
    content: { type: String, required: true },
    category: { type: String, default: 'all' },
    likes: { type: Number, default: 0 },
    comments: [CommentSchema],
    imageUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model<IPost>('Post', PostSchema);
export default Post;
