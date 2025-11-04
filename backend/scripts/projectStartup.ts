import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Ollama } from 'ollama';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const execAsync = promisify(exec);
const ollama = new Ollama();

// Use gemma:2b as the default model for conversational responses (optimized for speed)
const MODEL = process.env.OLLAMA_MODEL || 'gemma:2b';
const FALLBACK_MODEL = 'gemma:2b';
const HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const ROOT_DIR = path.join(__dirname, '../..');

// Auto-pull gemma:2b model if not available
async function ensureModel(): Promise<void> {
  try {
    const models = await ollama.list();
    const modelNames = models.models?.map(m => m.name) || [];
    
    if (!modelNames.includes(MODEL)) {
      console.log(`[Start] Pulling model: ${MODEL}`);
      await ollama.pull({ model: MODEL });
      console.log(`[Start] Model ${MODEL} ready`);
    } else {
      console.log(`[Start] Model already available: ${MODEL}`);
    }
  } catch (error) {
    console.warn(`[Start] Failed to pull ${MODEL}, trying fallback: ${FALLBACK_MODEL}`);
    try {
      await ollama.pull({ model: FALLBACK_MODEL });
      console.log(`[Start] Fallback model ${FALLBACK_MODEL} ready`);
      console.log(`[Start] Update your .env with: OLLAMA_MODEL=${FALLBACK_MODEL}`);
    } catch (fallbackError) {
      console.error(`[Start] Failed to pull any model:`, fallbackError);
    }
  }
}

async function checkOllamaRunning(): Promise<boolean> {
  try {
    const result = await execAsync('pgrep -f "ollama serve"');
    return result.stdout.trim().length > 0;
  } catch {
    return false;
  }
}

async function startOllama() {
  const isRunning = await checkOllamaRunning();
  
  if (!isRunning) {
    console.log('[Start] Starting Ollama server...');
    spawn('ollama', ['serve'], {
      detached: true,
      stdio: 'ignore',
    }).unref();
    
    // Wait for Ollama to start
    await new Promise((resolve) => setTimeout(resolve, 3000));
  } else {
    console.log('[Start] Ollama server already running');
  }
}

async function checkModel(): Promise<boolean> {
  try {
    const result = await execAsync('ollama list');
    return result.stdout.includes(MODEL);
  } catch {
    return false;
  }
}

async function pullModel() {
  // Use the model pulling function
  await ensureModel();
}

async function checkDataset(): Promise<boolean> {
  const dataPath = path.join(ROOT_DIR, 'backend/data/usda-foods.csv');
  return fs.existsSync(dataPath);
}

async function downloadDataset() {
  const hasDataset = await checkDataset();
  
  if (hasDataset) {
    console.log('[Start] Dataset already present');
  } else {
    console.log('[Start] Downloading USDA dataset (one-time operation)...');
    try {
      await execAsync('npm run download-data');
      console.log('[Start] Dataset ready');
    } catch (error) {
      console.warn('[Start] Dataset download failed, will use minimal dataset');
    }
  }
}

async function main() {
  try {
    console.log('[Start] NutriSolve Startup Script');
    console.log('[Start] =========================');
    
    // 1. Start Ollama
    await startOllama();
    
    // 2. Ensure model exists
    await pullModel();
    
    // 3. Ensure dataset exists
    await downloadDataset();
    
    console.log('[Start] All prerequisites ready!');
    console.log('[Start] Starting backend server...');
    
    // 4. Start the backend server
    const serverProcess = spawn('npm', ['run', 'start:backend'], {
      cwd: ROOT_DIR,
      stdio: 'inherit',
      shell: true,
    });
    
    serverProcess.on('error', (error) => {
      console.error('[Start] Failed to start backend:', error);
      process.exit(1);
    });
    
    serverProcess.on('close', (code) => {
      console.log(`[Start] Backend exited with code ${code}`);
      process.exit(code || 0);
    });
    
  } catch (error: any) {
    console.error('[Start] Error:', error.message);
    process.exit(1);
  }
}

main();
