import { Request, Response } from 'express';
import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import natural from 'natural';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { LRUCache } from 'lru-cache';
import pLimit from 'p-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TfIdf = natural.TfIdf;

// Initialize Ollama client with optimized settings
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11434',
});

// Model fallback configuration (fastest to slowest)
const MODELS = [
  'gemma:2b',      // Fastest, smaller model
  'phi3:mini',     // Medium speed, good quality
];

let currentModelIndex = 0;

// Chat model warm-up and optimization
let isChatModelWarmedUp = false;

// Get current model with fallback (force gemma:2b for speed)
const getCurrentModel = () => {
  return 'gemma:2b'; // Force fastest model
};

// Warm up the chat model on startup
const warmUpChatModel = async () => {
  if (isChatModelWarmedUp) return;
  
  const model = getCurrentModel();
  try {
    console.log(`[Chat] Warming up ${model} model for chat...`);
    const startTime = Date.now();
    
    await ollama.chat({
      model,
      messages: [{ role: 'user', content: 'Hi' }],
      options: {
        num_predict: 5,
        temperature: 0.1,
        num_ctx: 512, // Minimal context for warm-up
      },
    });
    
    const duration = Date.now() - startTime;
    console.log(`[Chat] Chat model ${model} warmed up in ${duration}ms`);
    isChatModelWarmedUp = true;
  } catch (error: any) {
    console.warn(`[Chat] Chat model ${model} warm-up failed:`, error.message);
    
    // Try fallback model
    if (currentModelIndex < MODELS.length - 1) {
      currentModelIndex++;
      console.log(`[Chat] Trying fallback model: ${MODELS[currentModelIndex]}`);
      isChatModelWarmedUp = false;
      return warmUpChatModel();
    }
  }
};

// Initialize chat warm-up
warmUpChatModel();

// Food data storage
let foods: any[] = [];
let tfidf: any = null;

// OPTIMIZATION 3: Enhanced LRU Cache for faster chat responses
const responseCache = new LRUCache<string, string>({
  max: 200,                    // Increased cache size
  ttl: 1000 * 60 * 20,        // 20 minutes TTL
});

// Additional cache for common queries
const quickResponseCache = new LRUCache<string, string>({
  max: 50,                     // Cache for frequent questions
  ttl: 1000 * 60 * 60,        // 1 hour for common responses
});

// OPTIMIZATION 2: Concurrency limiter using p-limit (prevents OOM/swapping)
const limit = pLimit(1); // Max 1 concurrent request to prevent memory issues

// Load USDA dataset
export async function loadUSDAData() {
  const dataDir = path.join(__dirname, '../data');
  const dataPath = path.join(dataDir, 'usda-foods.csv');
  const processedPath = path.join(dataDir, 'processed-usda.json');

  // Try to load from processed JSON first
  if (fs.existsSync(processedPath)) {
    try {
      const data = fs.readFileSync(processedPath, 'utf-8');
      foods = JSON.parse(data);
      console.log(`[Chat] Loaded ${foods.length} foods from processed JSON`);
      buildTfIdf();
      return;
    } catch (err) {
      console.warn('[Chat] Failed to load processed JSON, falling back to CSV');
    }
  }

  // Load from CSV
  if (!fs.existsSync(dataPath)) {
    console.warn('[Chat] USDA dataset not found. Run download script first.');
    foods = [];
    return;
  }

  return new Promise<void>((resolve, reject) => {
    const rows: any[] = [];
    fs.createReadStream(dataPath)
      .pipe(csv())
      .on('data', (row) => {
        const food = {
          fdc_id: row.fdc_id || row.FDC_ID || row.fdcid || null,
          description:
            row.description ||
            row.food_description ||
            row.SNDescription ||
            row.food ||
            row.name ||
            null,
          food_category:
            row.food_category || row.food_category_id || row.category || null,
          nutrients: row.nutrient || row.nutrients || null,
        };
        if (food.description) {
          rows.push(food);
        }
      })
      .on('end', () => {
        // Deduplicate and limit
        const seen = new Set<string>();
        foods = rows.filter((f) => {
          const key = f.description?.toLowerCase();
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        }).slice(0, 300);

        console.log(`[Chat] Loaded ${foods.length} foods from CSV`);

        // Save processed data
        try {
          fs.writeFileSync(processedPath, JSON.stringify(foods, null, 2));
          console.log('[Chat] Saved processed data to JSON');
        } catch (err) {
          console.warn('[Chat] Could not save processed JSON:', err);
        }

        buildTfIdf();
        resolve();
      })
      .on('error', reject);
  });
}

function buildTfIdf() {
  tfidf = new TfIdf();
  foods.forEach((food) => {
    const text = `${food.description || ''} ${food.food_category || ''}`.toLowerCase();
    tfidf.addDocument(text);
  });
  console.log('[Chat] Built TF-IDF index');
}

function searchFoods(query: string, limit: number = 3): any[] {
  if (!tfidf || foods.length === 0) return [];

  const scores: Array<{ index: number; score: number }> = [];
  tfidf.tfidfs(query.toLowerCase(), (i: number, score: number) => {
    if (score > 0) {
      scores.push({ index: i, score });
    }
  });

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, limit).map((s) => foods[s.index]);
}

// Helper function to create cache key
function createCacheKey(message: string, context: string): string {
  return `${message.toLowerCase()}-${context.slice(0, 100)}`;
}

export const chat = async (req: Request, res: Response) => {
  console.time('chat-response'); // OPTIMIZATION: Detailed timing
  const t0 = Date.now();
  
  try {
    const message = req.body?.message ? String(req.body.message) : '';
    const stream = req.body?.stream === true;

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    console.log('[Chat] 📝 Query received:', message.substring(0, 50) + '...');
    console.time('rag-search');

    // OPTIMIZATION 4: RAG with Top-3 Only (context reduction)
    const ragRows = searchFoods(message, 3);
    const context = JSON.stringify(ragRows);
    console.timeEnd('rag-search');

    // OPTIMIZATION 3: Enhanced cache checking (quick cache first, then regular)
    const cacheKey = createCacheKey(message, context);
    const quickCacheKey = message.toLowerCase().trim();
    
    // Check quick response cache first (for common questions)
    let cached = quickResponseCache.get(quickCacheKey);
    if (cached) {
      console.log('[Chat] ⚡ Quick cache hit!');
      console.timeEnd('chat-response');
      return res.json({
        success: true,
        response: cached,
        cached: true,
        cacheType: 'quick',
        ms: Date.now() - t0,
      });
    }

    // Check regular response cache
    cached = responseCache.get(cacheKey);
    if (cached) {
      console.log('[Chat] ⚡ Regular cache hit!');
      console.timeEnd('chat-response');
      return res.json({
        success: true,
        response: cached,
        cached: true,
        cacheType: 'regular',
        ms: Date.now() - t0,
      });
    }

    // OPTIMIZATION 7: Simplified system prompt for faster responses
    const system = 'You are a helpful nutrition assistant. Give brief, practical advice.';
    const userPrompt = message; // Simplified prompt without heavy context

    // OPTIMIZATION 6: Streaming responses (SSE)
    if (stream) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      });

      console.log('[Chat] 🤖 Sending query to Ollama (streaming)...');
      console.time('ollama-streaming');

      let fullResponse = '';

      try {
        // Ensure chat model is warmed up
        await warmUpChatModel();
        
        // OPTIMIZATION 2: Concurrency limiting with p-limit
        await limit(async () => {
          try {
            const response = await ollama.chat({
            model: getCurrentModel(),
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: userPrompt },
            ],
            stream: true,
            options: {
              num_predict: 100,    // Reduced for faster responses
              temperature: 0.7,    // Higher for more natural responses
              num_ctx: 512,        // Smaller context window
              top_p: 0.9,          // More variety
              top_k: 20,           // More token choices
            },
          });

          let chunkCount = 0;
          for await (const chunk of response) {
            const content = chunk.message?.content || '';
            if (content) {
              fullResponse += content;
              chunkCount++;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
          
          console.log(`[Chat] Complete response: ${fullResponse.length} chars, ${chunkCount} chunks`);
          
          // Retry if response seems incomplete (less than 200 chars)
          if (fullResponse.length < 200) {
            console.log('[Chat] Response seems incomplete, retrying with higher num_predict...');
            fullResponse = '';
            chunkCount = 0;
            
            const retryResponse = await ollama.chat({
              model: getCurrentModel(),
              messages: [
                { role: 'system', content: system },
                { role: 'user', content: userPrompt },
              ],
              stream: true,
              options: {
                num_predict: 400,    // Higher for retry
                temperature: 0.4,
                num_ctx: 1024,
                top_p: 0.8,
                top_k: 15,
                repeat_penalty: 1.1,
              },
            });
            
            for await (const chunk of retryResponse) {
              const content = chunk.message?.content || '';
              if (content) {
                fullResponse += content;
                chunkCount++;
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            }
            
            console.log(`[Chat] Retry complete: ${fullResponse.length} chars, ${chunkCount} chunks`);
          }
          } catch (ollamaError: any) {
            console.error('[Chat] Ollama streaming error:', ollamaError);
            throw new Error(`AI service unavailable: ${ollamaError.message}`);
          }
        });

        res.write('data: [DONE]\n\n');
        res.end();

        console.timeEnd('ollama-streaming');
        console.timeEnd('chat-response');
        console.log(`[Chat] ✅ Stream complete. Total time: ${Date.now() - t0}ms, Final response: ${fullResponse.length} chars`);

        // Cache the complete response in both caches
        responseCache.set(cacheKey, fullResponse);
        
        // Also cache in quick cache if it's a short, common question
        if (message.length < 50 && fullResponse.length < 200) {
          quickResponseCache.set(quickCacheKey, fullResponse);
        }
      } catch (streamError: any) {
        console.error('[Chat] Streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }
    } else {
      // Ensure chat model is warmed up
      await warmUpChatModel();
      
      // Non-streaming response (optimized)
      console.log('[Chat] 🤖 Sending query to Ollama (non-streaming, optimized)...');
      console.time('ollama-request');

      // OPTIMIZATION 2: Concurrency limiting with p-limit
      const response = await limit(() =>
        ollama.chat({
          model: getCurrentModel(),
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userPrompt },
          ],
          options: {
            num_predict: 100,    // Reduced for faster responses
            temperature: 0.7,    // Higher for more natural responses
            num_ctx: 512,        // Smaller context window
            top_p: 0.9,          // More variety
            top_k: 20,           // More token choices
          },
        })
      ) as any;

      console.timeEnd('ollama-request');

      const content =
        response?.message?.content ||
        'Sorry, I could not generate a response right now.';
      
      console.log(`[Chat] ✅ Non-streaming complete: ${content.length} chars`);
      console.log('[Chat] ✅ Ollama response received:', content.substring(0, 100) + '...');
      console.timeEnd('chat-response');
      console.log(`[Chat] ⏱️  Total response time: ${Date.now() - t0}ms`);

      // Cache the response in both caches
      responseCache.set(cacheKey, content);
      
      // Also cache in quick cache if it's a short, common question
      if (message.length < 50 && content.length < 200) {
        quickResponseCache.set(quickCacheKey, content);
      }

      res.json({
        success: true,
        response: content,
        cached: false,
        ms: Date.now() - t0,
      });
    }
  } catch (error: any) {
    console.error('[Chat] Error:', error);
    console.timeEnd('chat-response');
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};

// Export cache management functions
export const getCacheStats = () => {
  return {
    responseCache: {
      size: responseCache.size,
      maxSize: responseCache.max,
    },
    quickResponseCache: {
      size: quickResponseCache.size,
      maxSize: quickResponseCache.max,
    },
  };
};

export const clearCaches = () => {
  responseCache.clear();
  quickResponseCache.clear();
  console.log('[Chat] All caches cleared (regular + quick)');
};
