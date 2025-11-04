import { Request, Response } from 'express';
import Post from '../models/Post';

export const getPosts = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    const filter: any = {};
    if (category && category !== 'all') {
      filter.category = category;
    }

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      posts,
    });
  } catch (error: any) {
    console.error('[Community] Get posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts',
    });
  }
};

export const createPost = async (req: Request, res: Response) => {
  try {
    const { content, category, imageUrl } = req.body;
    const user = (req as any).user; // Set by auth middleware

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Post content is required',
      });
    }

    // Generate avatar from username
    const avatar = user.username
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const post = new Post({
      author: user.username,
      userId: user.userId,
      avatar,
      content,
      category: category || 'all',
      imageUrl,
    });

    await post.save();

    res.status(201).json({
      success: true,
      post,
    });
  } catch (error: any) {
    console.error('[Community] Create post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create post',
    });
  }
};

export const likePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    post.likes += 1;
    await post.save();

    res.json({
      success: true,
      likes: post.likes,
    });
  } catch (error: any) {
    console.error('[Community] Like post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like post',
    });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const user = (req as any).user;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Comment content is required',
      });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    const avatar = user.username
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const comment = {
      author: user.username,
      avatar,
      content,
      likes: 0,
      timestamp: new Date(),
    };

    post.comments.push(comment as any);
    await post.save();

    res.json({
      success: true,
      comment,
    });
  } catch (error: any) {
    console.error('[Community] Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
    });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
      });
    }

    // Check if user owns the post
    if (post.userId.toString() !== user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own posts',
      });
    }

    await Post.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Post deleted',
    });
  } catch (error: any) {
    console.error('[Community] Delete post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete post',
    });
  }
};
