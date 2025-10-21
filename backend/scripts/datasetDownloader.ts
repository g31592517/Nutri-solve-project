import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import AdmZip from 'adm-zip';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const USDA_URL = 'https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2024-04-18.zip';

async function downloadDataset() {
  try {
    const dataDir = path.join(__dirname, '../data');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('[Download] Created data directory');
    }

    const finalCsv = path.join(dataDir, 'usda-foods.csv');
    
    // Check if dataset already exists
    if (fs.existsSync(finalCsv)) {
      console.log('[Download] Dataset already present, skipping download.');
      process.exit(0);
    }

    console.log('[Download] Downloading USDA dataset zip...');
    console.log(`[Download] URL: ${USDA_URL}`);
    
    const response = await fetch(USDA_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.buffer();
    console.log(`[Download] Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

    console.log('[Download] Extracting zip...');
    const zip = new AdmZip(buffer);
    zip.extractAllTo(dataDir, true);
    console.log('[Download] Extracted successfully');

    // Find the foundation foods CSV and rename
    const extractedEntries = fs.readdirSync(dataDir);
    const subdir = extractedEntries.find((f) =>
      f.toLowerCase().startsWith('fooddata_central_foundation_food_csv_')
    );

    if (!subdir) {
      throw new Error('Could not find extracted subdirectory');
    }

    const subdirPath = path.join(dataDir, subdir);
    const foundationCsv = path.join(subdirPath, 'foundation_food.csv');

    if (!fs.existsSync(foundationCsv)) {
      // Try alternate names
      const files = fs.readdirSync(subdirPath);
      const csvFile = files.find((f) => f.toLowerCase().includes('foundation') && f.endsWith('.csv'));
      
      if (!csvFile) {
        console.warn('[Download] Foundation CSV not found. Available files:');
        console.log(files);
        
        // Use the first CSV file as fallback
        const fallbackCsv = files.find((f) => f.endsWith('.csv'));
        if (fallbackCsv) {
          const fallbackPath = path.join(subdirPath, fallbackCsv);
          fs.copyFileSync(fallbackPath, finalCsv);
          console.log(`[Download] Using fallback CSV: ${fallbackCsv}`);
        } else {
          throw new Error('No CSV files found in extracted directory');
        }
      } else {
        const csvPath = path.join(subdirPath, csvFile);
        fs.copyFileSync(csvPath, finalCsv);
        console.log(`[Download] Copied ${csvFile} to usda-foods.csv`);
      }
    } else {
      fs.copyFileSync(foundationCsv, finalCsv);
      console.log('[Download] Copied foundation_food.csv to usda-foods.csv');
    }

    console.log('[Download] Dataset ready at:', finalCsv);
    console.log('[Download] Complete!');
  } catch (error: any) {
    console.error('[Download] Error:', error.message);
    process.exit(1);
  }
}

// Run the download
downloadDataset();
