import { spawn, exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODEL = process.env.OLLAMA_MODEL || 'phi3:mini';
const HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';
const ROOT_DIR = path.join(__dirname, '../..');

function execPromise(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

async function checkOllamaRunning(): Promise<boolean> {
  try {
    const result = await execPromise('pgrep -f "ollama serve"');
    return result.trim().length > 0;
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
    const result = await execPromise('ollama list');
    return result.includes(MODEL);
  } catch {
    return false;
  }
}

async function pullModel() {
  const hasModel = await checkModel();
  
  if (hasModel) {
    console.log(`[Start] Model already available: ${MODEL}`);
  } else {
    console.log(`[Start] Pulling model ${MODEL} (one-time operation)...`);
    await execPromise(`ollama pull ${MODEL}`);
    console.log(`[Start] Model ${MODEL} ready`);
  }
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
    await execPromise('npm run download-data');
    console.log('[Start] Dataset ready');
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
