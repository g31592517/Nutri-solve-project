#!/usr/bin/env node

/**
 * Mock Chat Performance Test
 * Demonstrates optimized chat performance with simulated responses
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5002; // Different port for mock

app.use(cors());
app.use(express.json());

// Mock optimized caching system
const quickCache = new Map();
const regularCache = new Map();
const QUICK_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const REGULAR_CACHE_TTL = 20 * 60 * 1000; // 20 minutes

// Mock responses for different query types
const mockResponses = {
  'hi': '👋 Hello! I\'m NutriAI, ready to help with your nutrition questions!',
  'what is protein?': '🥩 Protein is a macronutrient essential for building and repairing tissues. It\'s made of amino acids and found in meat, fish, eggs, dairy, legumes, and nuts. Adults need about 0.8g per kg of body weight daily. 💪',
  'is chicken breast healthy?': '🐔 Yes! Chicken breast is very healthy - it\'s lean protein (about 25g per 100g), low in fat, and rich in B vitamins and selenium. Great for muscle building and weight management! 🏋️‍♀️',
  'how much protein should i eat daily for muscle building?': '💪 For muscle building, aim for 1.6-2.2g protein per kg of body weight daily. Spread it across meals, include post-workout protein within 2 hours, and combine with resistance training. Quality sources: lean meats, fish, eggs, dairy, legumes! 🥚🐟'
};

// Simulate optimized response generation
const generateMockResponse = (message) => {
  const lowerMessage = message.toLowerCase().trim();
  
  // Check for exact matches first (quick cache simulation)
  if (mockResponses[lowerMessage]) {
    return mockResponses[lowerMessage];
  }
  
  // Generate contextual response (regular cache simulation)
  if (lowerMessage.includes('protein')) {
    return '🥩 Protein is essential for your body! It helps build muscle, repair tissues, and maintain healthy metabolism. Good sources include lean meats, fish, eggs, dairy, and plant-based options like beans and quinoa. 💪';
  }
  
  if (lowerMessage.includes('healthy') || lowerMessage.includes('nutrition')) {
    return '🌟 Great nutrition question! Focus on whole foods, balanced macronutrients, and adequate hydration. I\'m here to help with specific nutrition advice! 🥗';
  }
  
  return '🤖 I\'m NutriAI! I can help with nutrition questions about proteins, healthy foods, meal planning, and dietary advice. What would you like to know? 🍎';
};

// Mock chat endpoint with optimized performance simulation
app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  const startTime = Date.now();
  
  console.log(`📝 Chat query: "${message}"`);
  
  const quickCacheKey = message.toLowerCase().trim();
  const regularCacheKey = `${message}-context`;
  
  // Simulate quick cache check (instant for common questions)
  if (quickCache.has(quickCacheKey)) {
    const cached = quickCache.get(quickCacheKey);
    if (Date.now() - cached.timestamp < QUICK_CACHE_TTL) {
      const duration = Date.now() - startTime;
      console.log(`⚡ Quick cache hit! (${duration}ms)`);
      return res.json({
        success: true,
        response: cached.data,
        cached: true,
        cacheType: 'quick',
        ms: duration
      });
    }
  }
  
  // Simulate regular cache check (fast for contextual queries)
  if (regularCache.has(regularCacheKey)) {
    const cached = regularCache.get(regularCacheKey);
    if (Date.now() - cached.timestamp < REGULAR_CACHE_TTL) {
      const duration = Date.now() - startTime + Math.random() * 100; // Add small delay
      console.log(`⚡ Regular cache hit! (${duration}ms)`);
      return res.json({
        success: true,
        response: cached.data,
        cached: true,
        cacheType: 'regular',
        ms: duration
      });
    }
  }
  
  // Simulate optimized generation (much faster than real Ollama)
  const generationDelay = message.length < 20 ? 
    1000 + Math.random() * 2000 : // Short questions: 1-3 seconds
    2000 + Math.random() * 4000;  // Longer questions: 2-6 seconds
  
  setTimeout(() => {
    const response = generateMockResponse(message);
    const duration = Date.now() - startTime;
    
    console.log(`🤖 Generated response (${duration}ms)`);
    
    // Cache the response
    const cacheData = { data: response, timestamp: Date.now() };
    regularCache.set(regularCacheKey, cacheData);
    
    // Also cache in quick cache if it's a short, common question
    if (message.length < 50 && response.length < 200) {
      quickCache.set(quickCacheKey, cacheData);
    }
    
    res.json({
      success: true,
      response,
      cached: false,
      ms: duration
    });
  }, generationDelay);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mock Optimized Chat API is running',
    timestamp: new Date().toISOString()
  });
});

// Cache stats
app.get('/api/cache-stats', (req, res) => {
  res.json({
    quickResponseCache: {
      size: quickCache.size,
      maxSize: 50
    },
    responseCache: {
      size: regularCache.size,
      maxSize: 200
    }
  });
});

// Start mock server
app.listen(PORT, () => {
  console.log(`🎭 Mock Optimized Chat API running on http://localhost:${PORT}`);
  console.log('📋 Simulating optimized chat performance:');
  console.log('  - Quick cache: <100ms for common questions');
  console.log('  - Regular cache: <200ms for contextual queries');
  console.log('  - Optimized generation: 1-6 seconds (vs 15-30s real Ollama)');
  console.log('  - Dual caching system active');
  console.log('\n🧪 Ready for performance testing!');
});

export default app;
