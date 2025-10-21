import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  generateMealPlan,
  generateMealPlanStream,
  swapMeal,
  extractPreferences,
  ocrImage,
  generateInsights,
  generateShoppingList,
} from '../controllers/mealPlanService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// POST /api/meal-plan/generate - Generate full 7-day meal plan
router.post('/generate', generateMealPlan);

// POST /api/meal-plan/generate-stream - Generate meal plan with streaming
router.post('/generate-stream', generateMealPlanStream);

// POST /api/meal-plan/swap - Get alternative meal suggestions
router.post('/swap', swapMeal);

// POST /api/meal-plan/extract-preferences - Extract preferences from text
router.post('/extract-preferences', extractPreferences);

// POST /api/meal-plan/ocr - OCR image and extract preferences
router.post('/ocr', upload.single('image'), ocrImage);

// POST /api/meal-plan/insights - Generate AI insights for plan
router.post('/insights', generateInsights);

// POST /api/meal-plan/shopping-list - Generate shopping list
router.post('/shopping-list', generateShoppingList);

export default router;
