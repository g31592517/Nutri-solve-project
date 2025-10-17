import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

const MODEL = process.env.OLLAMA_MODEL || 'phi3:mini';
const FALLBACK_MODEL = 'llama3.2:3b-q4_0';

async function checkOllamaInstalled(): Promise<boolean> {
  try {
    await execPromise('which ollama');
    return true;
  } catch {
    return false;
  }
}

async function checkModel(modelName: string): Promise<boolean> {
  try {
    const { stdout } = await execPromise('ollama list');
    return stdout.includes(modelName);
  } catch {
    return false;
  }
}

async function pullModel(modelName: string) {
  console.log(`[Model] Pulling ${modelName}...`);
  console.log('[Model] This is a one-time operation and may take a few minutes.');
  
  try {
    const { stdout, stderr } = await execPromise(`ollama pull ${modelName}`);
    console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`[Model] ✅ ${modelName} pulled successfully!`);
    return true;
  } catch (error: any) {
    console.error(`[Model] ❌ Failed to pull ${modelName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('[Model] NutriSolve Model Setup');
  console.log('[Model] =====================');
  
  // Check if Ollama is installed
  const ollamaInstalled = await checkOllamaInstalled();
  if (!ollamaInstalled) {
    console.error('[Model] ❌ Ollama is not installed!');
    console.error('[Model] Please install Ollama from: https://ollama.ai/');
    process.exit(1);
  }
  
  console.log('[Model] ✅ Ollama is installed');
  
  // Check if model is already present
  const hasModel = await checkModel(MODEL);
  if (hasModel) {
    console.log(`[Model] ✅ ${MODEL} is already available`);
    console.log('[Model] Model size: ~2GB (phi3:mini) or ~1.5GB (llama3.2:3b-q4_0)');
    process.exit(0);
  }
  
  // Try to pull primary model
  console.log(`[Model] Attempting to pull primary model: ${MODEL}`);
  const success = await pullModel(MODEL);
  
  if (!success) {
    console.log(`[Model] Trying fallback model: ${FALLBACK_MODEL}`);
    const fallbackSuccess = await pullModel(FALLBACK_MODEL);
    
    if (!fallbackSuccess) {
      console.error('[Model] ❌ Failed to pull any model');
      console.error('[Model] Please check your internet connection and try again');
      process.exit(1);
    }
    
    console.log(`[Model] Update your .env with: OLLAMA_MODEL=${FALLBACK_MODEL}`);
  }
  
  console.log('[Model] ✅ Setup complete!');
  console.log('[Model] You can now start the server with: npm start');
}

main().catch((error) => {
  console.error('[Model] Fatal error:', error);
  process.exit(1);
});
