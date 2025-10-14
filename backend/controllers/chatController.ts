import { Request, Response } from 'express';
import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import natural from 'natural';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

// Simple cache implementation
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 100;

// Simple concurrency limiter
let activeRequests = 0;
const queue: Array<() => void> = [];
const MAX_CONCURRENT = 1;

function createLimiter() {
  return async <T>(fn: () => Promise<T>): Promise<T> => {
    if (activeRequests >= MAX_CONCURRENT) {
      await new Promise<void>((resolve) => {
        queue.push(() => resolve());
      });
    }
    activeRequests++;
    try {
      return await fn();
    } finally {
      activeRequests--;
      const next = queue.shift();
      if (next) next();
    }
  };
}

const limit = createLimiter();

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

function cacheGet(key: string): string | null {
  const cached = responseCache.get(key);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    responseCache.delete(key);
    return null;
  }

  return cached.response;
}

function cacheSet(key: string, value: string) {
  responseCache.set(key, { response: value, timestamp: Date.now() });

  if (responseCache.size > MAX_CACHE_SIZE) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey !== undefined) {
      responseCache.delete(firstKey);
    }
  }
}

export const chat = async (req: Request, res: Response) => {
  const t0 = Date.now();
  
  try {
    const message = req.body?.message ? String(req.body.message) : '';

    if (!message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    // RAG: search for relevant foods
    const ragRows = searchFoods(message, 3);
    const context = JSON.stringify(ragRows);

    // Check cache
    const cacheKey = `${message}\n${context}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      return res.json({
        success: true,
        response: cached,
        cached: true,
        ms: Date.now() - t0,
      });
    }

    // System prompt from AI documentation
    const system =
      'You are NutriAI, a fun nutrition expert using USDA data. Answer briefly, practical, and on-topic for meal plans, allergies, budgets, weight tips, and myths. Use occasional emojis (e.g., 🍎, 💪). No disclaimers.';
    const userPrompt = `Context: ${context}\nQuery: ${message}`;

    // Call Ollama with concurrency limiting and timeout
    const response = await Promise.race([
      limit(() =>
        ollama.chat({
          model: process.env.OLLAMA_MODEL || 'phi3:mini',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userPrompt },
          ],
          options: { num_predict: 150 },
        })
      ),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Ollama request timeout after 45s')), 45000)
      ),
    ]) as any;

    const content =
      response?.message?.content ||
      'Sorry, I could not generate a response right now.';

    // Cache the response
    cacheSet(cacheKey, content);

    res.json({
      success: true,
      response: content,
      cached: false,
      ms: Date.now() - t0,
    });
  } catch (error: any) {
    console.error('[Chat] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
};
