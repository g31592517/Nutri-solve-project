/**
 * Recommendation API Routes
 * Machine Learning-powered meal recommendation endpoints
 */

import express from 'express';
import {
  getRecommendations,
  getRecommendationsWithChat,
  checkMLStatus,
  trainMLModel,
} from '../controllers/recommendationHandler.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/recommend
 * @desc    Get personalized meal recommendations using ML model
 * @access  Private (requires authentication)
 * @body    { userProfile: {...}, query: string, top_k?: number }
 * @returns { success: boolean, data: MLResponse, timestamp: string }
 */
router.post('/recommend', authenticateToken, getRecommendations);

/**
 * @route   POST /api/recommend-with-chat
 * @desc    Get recommendations + Ollama natural language response
 * @access  Private (requires authentication)
 * @body    { userProfile: {...}, query: string, top_k?: number }
 * @returns { success: boolean, data: { recommendations, ollamaContext }, timestamp: string }
 */
router.post('/recommend-with-chat', authenticateToken, getRecommendationsWithChat);

/**
 * @route   GET /api/recommend/status
 * @desc    Check if ML models are trained and ready
 * @access  Public (for debugging)
 * @returns { ready: boolean, components: {...}, metrics: {...}, instructions: string }
 */
router.get('/recommend/status', checkMLStatus);

/**
 * @route   POST /api/recommend/train
 * @desc    Trigger ML model training (admin only in production)
 * @access  Private (requires authentication)
 * @returns { success: boolean, message: string, output: {...} }
 * 
 * WARNING: This is a long-running operation (2-5 minutes)
 * In production, use a job queue (Bull, BullMQ) instead
 */
router.post('/recommend/train', authenticateToken, trainMLModel);

export default router;
