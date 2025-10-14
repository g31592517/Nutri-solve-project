import { Router } from 'express';
import { chat } from '../controllers/chatController.js';
import {
  getPosts,
  createPost,
  likePost,
  addComment,
  deletePost,
} from '../controllers/communityController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Chat routes
router.post('/chat', authenticate, chat);

// Community routes
router.get('/posts', getPosts);
router.post('/posts', authenticate, createPost);
router.post('/posts/:id/like', authenticate, likePost);
router.post('/posts/:id/comments', authenticate, addComment);
router.delete('/posts/:id', authenticate, deletePost);

export default router;
