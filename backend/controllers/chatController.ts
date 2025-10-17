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

// Initialize Ollama client
const ollama = new Ollama({
  host: process.env.OLLAMA_HOST || 'http://localhost:11434',
});

// Food data storage
let foods: any[] = [];
let tfidf: any = null;

// OPTIMIZATION 3: LRU Cache for response caching (better than Map)
const responseCache = new LRUCache<string, string>({
  max: 100,
  ttl: 1000 * 60 * 15, // 15 minutes
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

    // OPTIMIZATION 3: Check LRU cache
    const cacheKey = createCacheKey(message, context);
    const cached = responseCache.get(cacheKey);
    if (cached) {
      console.log('[Chat] ⚡ Cache hit!');
      console.timeEnd('chat-response');
      return res.json({
        success: true,
        response: cached,
        cached: true,
        ms: Date.now() - t0,
      });
    }

    // OPTIMIZATION 7: Optimized system prompt (concise, token-limited)
    const system =
      'You are NutriAI: Concise, practical nutrition advice with emojis. Use context only. End after key points.';
    const userPrompt = `Context: ${context}\nQuery: ${message}`;

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
        // OPTIMIZATION 2: Concurrency limiting with p-limit
        await limit(async () => {
          const response = await ollama.chat({
            model: process.env.OLLAMA_MODEL || 'phi3:mini', // OPTIMIZATION 1: Small model
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: userPrompt },
            ],
            stream: true,
            options: {
              num_predict: 150, // OPTIMIZATION 7: Token limit (3x faster)
              temperature: 0.4, // Lower temp for factual responses
              top_p: 0.9,
              top_k: 20,
            },
          });

          for await (const chunk of response) {
            const content = chunk.message?.content || '';
            if (content) {
              fullResponse += content;
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          }
        });

        res.write('data: [DONE]\n\n');
        res.end();

        console.timeEnd('ollama-streaming');
        console.timeEnd('chat-response');
        console.log('[Chat] ✅ Stream complete. Total time:', Date.now() - t0, 'ms');

        // Cache the complete response
        responseCache.set(cacheKey, fullResponse);
      } catch (streamError: any) {
        console.error('[Chat] Streaming error:', streamError);
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response (fallback)
      console.log('[Chat] 🤖 Sending query to Ollama (non-streaming)...');
      console.time('ollama-request');

      // OPTIMIZATION 2: Concurrency limiting with p-limit
      const response = await limit(() =>
        ollama.chat({
          model: process.env.OLLAMA_MODEL || 'phi3:mini', // OPTIMIZATION 1: Small model
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userPrompt },
          ],
          options: {
            num_predict: 150, // OPTIMIZATION 7: Token limit (3x faster)
            temperature: 0.4, // Lower temp for factual responses
            top_p: 0.9,
            top_k: 20,
          },
        })
      ) as any;

      console.timeEnd('ollama-request');

      const content =
        response?.message?.content ||
        'Sorry, I could not generate a response right now.';
      
      console.log('[Chat] ✅ Ollama response received:', content.substring(0, 100) + '...');
      console.timeEnd('chat-response');
      console.log('[Chat] ⏱️  Total response time:', Date.now() - t0, 'ms');

      // Cache the response
      responseCache.set(cacheKey, content);

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
