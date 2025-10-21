import { Router } from 'express';
import { chat, getCacheStats, clearCaches } from '../controllers/chatController.js';
import {
  getPosts,
  createPost,
  likePost,
  addComment,
  deletePost,
} from '../controllers/communityController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Chat routes (temporarily remove auth for testing)
router.post('/chat', chat);

// Simple test endpoint
router.post('/test-chat', async (req, res) => {
  try {
    const { Ollama } = await import('ollama');
    const ollama = new Ollama({ host: 'http://localhost:11434' });
    
    console.log('[Test] Testing simple Ollama call...');
    const response = await ollama.chat({
      model: 'gemma:2b',
      messages: [{ role: 'user', content: req.body.message || 'Hi' }],
      options: {
        num_predict: 50,
        temperature: 0.7,
        num_ctx: 512,
      },
    });
    
    res.json({
      success: true,
      response: response.message?.content || 'No response',
      model: 'gemma:2b'
    });
  } catch (error: any) {
    console.error('[Test] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Performance monitoring routes
router.get('/cache-stats', (req, res) => {
  res.json({
    success: true,
    stats: getCacheStats(),
    timestamp: new Date().toISOString()
  });
});

router.post('/clear-caches', (req, res) => {
  clearCaches();
  res.json({
    success: true,
    message: 'Caches cleared successfully',
    timestamp: new Date().toISOString()
  });
});

// Community routes
router.get('/posts', getPosts);
router.post('/posts', authenticate, createPost);
router.post('/posts/:id/like', authenticate, likePost);
router.post('/posts/:id/comments', authenticate, addComment);
router.delete('/posts/:id', authenticate, deletePost);

export default router;
