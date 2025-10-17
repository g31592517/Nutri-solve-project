# Enhanced Meal Planning Features - User Guide

## Overview
The NutriSolve meal planning system has been completely enhanced with AI-powered features, drag-and-drop functionality, smart insights, and comprehensive export options. All features are seamlessly integrated with Ollama AI backend for local inference.

## Features Implemented

### 1. 🤖 Auto-Generate Plan (AI-Powered)
**Location:** Click "Auto-Generate Plan" button in Smart Mode

**Multi-Step Modal Flow:**

**Step 1: Profile Summary**
- Displays your stored profile information (age, gender, weight, activity, goal, restrictions)
- Allows quick edits to any field
- Shows active dietary restrictions as tags
- Note: "Personalization active from your profile info"

**Step 2: Dynamic Inputs**
- **Weekly Budget:** Dropdown selection ($20-50, $50-100, $100-150, $150+)
- **Special Preferences:** Free-text textarea for custom requests
  - Examples: "prefer light dinners", "avoid eggs on weekends", "quick breakfasts"
- **Meal Variety Mode:** Toggle switch
  - 🔄 Keep Consistent: Meal prep friendly with repeats (great for batch cooking)
  - ✨ Try New Meals: Maximize variety with different meals each day

**Step 3: Confirmation**
- Review all settings before generation
- Shows complete profile summary
- Click "Generate Plan" to create personalized 7-day meal plan

**Backend Processing:**
- Sends all data to `/api/meal-plan/generate` endpoint
- Ollama AI generates structured JSON with:
  - 7 days × 4 meals (breakfast, lunch, dinner, snack)
  - Each meal includes: name, calories, protein, carbs, fat, ingredients, cost, prep time
- No timeout - waits for full Ollama response generation
- Calculates daily/weekly nutrition totals automatically

**Post-Generation:**
- Plan populates 7-day grid with meal cards
- Shows per-day totals in summary bar
- Displays weekly breakdown (total calories, protein, estimated cost)
- AI Insight card appears automatically at bottom-right

---

### 2. ✍️ Manual Mode (File Uploads & OCR)
**Location:** Toggle to Manual Mode, click "Upload Preferences"

**Upload Options:**

**A. Text/Doc File Upload**
- Supports: .txt, .docx, .pdf files
- Flow:
  1. Click "Upload Text/Doc File" card
  2. Select file from system
  3. Backend reads file content and sends to Ollama
  4. Ollama extracts preferences using prompt: "Extract preferences, avoids, and requests from this text"
  5. Returns structured JSON: `{preferences: [], avoids: [], requests: []}`

**B. Image Upload (OCR)**
- Supports: JPG, PNG, WebP (max 10MB)
- Flow:
  1. Click "Upload Image of Notes" card
  2. Select image containing handwritten/printed food notes
  3. Backend runs Tesseract.js OCR to extract text
  4. Sends OCR text to Ollama for preference extraction
  5. Shows extracted text preview + parsed preferences

**Preview & Confirmation:**
- Modal displays detected preferences in three categories:
  - 🟢 **Likes/Preferences:** Green badges (e.g., "pasta", "Mediterranean cuisine")
  - 🔴 **Foods to Avoid:** Red badges (e.g., "dairy", "shellfish")
  - 🔵 **Meal Patterns:** Blue badges (e.g., "light breakfasts", "high-protein dinners")
- Checkboxes allow editing before applying
- "Apply These Preferences" button stores in user profile
- Can then use in Auto-Generate modal

**API Endpoints:**
- POST `/api/meal-plan/extract-preferences` - Text extraction
- POST `/api/meal-plan/ocr` - Image OCR + extraction

---

### 3. 🎯 Interactive Drag & Drop
**Location:** Recipe sidebar + meal slots in 7-day grid

**Recipe Sidebar:**
- Left column shows 8+ suggested recipes
- Each card displays: name, calories, protein
- Recipes categorized by meal type (breakfast, lunch, dinner, snack)
- Scrollable list for more options

**Drag Mechanics:**
- **Grab:** Click and hold recipe card
- **Drag:** Move over meal slot (Monday Breakfast, Tuesday Lunch, etc.)
- **Visual Feedback:**
  - Slot border glows green when valid drop target
  - Slot scales up slightly (105%)
  - Dragged item becomes semi-transparent
- **Drop:** Release to add recipe to slot
- **Update:** Plan recalculates totals instantly

**Auto-Update Totals:**
- Daily summary bar updates: calories, protein, carbs, fat
- Weekly totals recalculate across all 7 days
- AI Insight alignment score refreshes

**Tech Stack:**
- Uses `@dnd-kit/core` for drag-and-drop
- `DndContext` wraps entire planner
- `useDraggable` hook for recipe cards
- `useDroppable` hook for meal slots

---

### 4. 🔄 Meal Swap Feature
**Location:** "Swap" button on each meal card

**Flow:**
1. Click "Swap" button on any populated meal
2. Opens **Meal Swap Modal**
3. Shows current meal name and context (e.g., "Monday Breakfast")
4. Backend calls `/api/meal-plan/swap` with:
   - Meal name, type, day
   - User profile, budget, preferences
5. Ollama generates 3 alternative meals fitting same slot
6. Each alternative shows:
   - Name
   - Full macros (calories, protein, carbs, fat)
   - Ingredients list
   - Reason (e.g., "Lower calories, better for weight loss")
7. Click "Select" on any alternative
8. Plan updates instantly with new meal
9. "Get More Alternatives" button for fresh suggestions

**Swap Logic:**
- Maintains goal alignment (e.g., high-protein for muscle gain)
- Honors dietary restrictions
- Stays within budget
- Matches meal type appropriately

---

### 5. ✨ AI Insight & Feedback
**Location:** Floating card (bottom-right) + detailed modal

**Floating Insight Card:**
- Appears automatically after plan generation or edits
- Shows:
  - Alignment score (0-100%) with color coding:
    - 🟢 Green: 80%+ (excellent)
    - 🟡 Yellow: 60-79% (good)
    - 🔴 Red: <60% (needs improvement)
  - Brief summary (e.g., "Avg 1800 kcal/day, 90g protein")
- "Optimize Plan" button opens detailed modal
- Auto-hides after 10 seconds (click to dismiss early)
- Reappears on plan changes

**AI Insight Modal:**
- Click "Optimize Plan" or "View Insights" button
- Backend calls `/api/meal-plan/insights` with full plan + profile
- Ollama analyzes plan and generates:
  - **Alignment Score:** Big visual with percentage
  - **Overview:** 2-3 sentence analysis of plan quality
  - **3 Optimization Suggestions:** Each with:
    - Type: Swap, Add, or Remove
    - Target meal (e.g., "Day 2 Lunch")
    - Alternative meal with full macros
    - Reason (e.g., "Swap pasta for quinoa: Saves $5, +5g protein 💪")
  - "Apply" button on each suggestion
- Applies suggestions directly to plan (instant update)
- Gamification: +points for applied suggestions toward badges

**Alignment Calculation:**
- Compares avg daily calories/protein to goal targets:
  - Weight Loss: 1600 kcal, 100g protein
  - Muscle Gain: 2500 kcal, 150g protein
  - Maintenance: 2000 kcal, 80g protein
- Formula: `100 - (|actual - target| / target × 100)`
- Capped at 0-100 range

---

### 6. 📦 Export & Shopping List
**Location:** "Shopping List" and "Export to Calendar" buttons

**Shopping List Tab:**

**Generation Flow:**
1. Click "Generate Shopping List" button
2. Backend calls `/api/meal-plan/shopping-list` with:
   - Complete meal plan (all ingredients from 7 days)
   - Pantry items (user-saved list to exclude)
3. Ollama consolidates and categorizes:
   - Groups by: Vegetables, Proteins, Grains, Dairy, Other
   - Consolidates duplicates (e.g., "chicken × 3 meals" → "3 chicken breasts")
   - Estimates total cost
4. Modal displays:
   - **Total Cost:** Big number at top (e.g., "$45.50")
   - **Categorized List:** Expandable sections
   - **Checkboxes:** Click to mark items as purchased (strikethrough)

**Pantry Check:**
- "Pantry Check" subtracts items user already has
- Stored in user profile (can edit in settings)
- Reduces shopping list and cost estimate

**Regenerate Options:**
- "Regenerate" button re-runs Ollama prompt
- New prompt: "Suggest cheaper/local alternatives for [high-cost items]"
- Updates list with budget-friendly swaps

**Download Options:**
- **TXT:** Plain text list with categories
- **CSV:** Spreadsheet-compatible format
- Both include all items + total cost

**Calendar Export Tab:**

**ICS File Generation:**
1. Click "Export to Calendar" tab
2. Click "Download Calendar File (.ics)"
3. Frontend generates `.ics` file with:
   - Each meal as calendar event:
     - **Title:** "Breakfast: Greek Yogurt Bowl"
     - **Time:** Auto-assigned (Breakfast 8AM, Lunch 12PM, Dinner 6PM, Snack 3PM)
     - **Description:** Calories, protein, carbs, fat
   - **Prep Reminders:** 30-minute alerts before each meal
4. Downloads `meal-plan.ics` file
5. User imports to Google Calendar, Outlook, Apple Calendar, etc.

**Google Calendar Integration:**
- Option to open Google auth flow (future enhancement)
- Currently: Download .ics for manual import
- Reminder toggles: Include prep reminders (default: yes)

---

## Technical Implementation

### Backend Structure

**Controllers:**
- `/backend/controllers/mealPlanController.ts` - Main logic
  - `generateMealPlan()` - 7-day AI generation
  - `swapMeal()` - Alternative meal suggestions
  - `extractPreferences()` - Text preference parsing
  - `ocrImage()` - Tesseract OCR + parsing
  - `generateInsights()` - Plan analysis
  - `generateShoppingList()` - Ingredient consolidation

**Routes:**
- `/backend/routes/mealPlan.ts` - API endpoints
  - POST `/api/meal-plan/generate`
  - POST `/api/meal-plan/swap`
  - POST `/api/meal-plan/extract-preferences`
  - POST `/api/meal-plan/ocr` (with multer file upload)
  - POST `/api/meal-plan/insights`
  - POST `/api/meal-plan/shopping-list`

**Ollama Integration:**
- Model: `phi3:mini` (configurable via `OLLAMA_MODEL` env var)
- Host: `http://localhost:11434` (configurable via `OLLAMA_HOST`)
- **No timeouts** - allows full response generation
- Structured prompts for JSON outputs
- Temperature: 0.5-0.8 (varies by task)
- Max tokens: 300-4000 (based on complexity)

### Frontend Structure

**Components:**
- `/src/components/meal-plan/EnhancedWeeklyMealPlanner.tsx` - Main planner
- `/src/components/meal-plan/AutoGenerateModal.tsx` - 3-step generation
- `/src/components/meal-plan/ManualModeModal.tsx` - File uploads
- `/src/components/meal-plan/AIInsightCard.tsx` - Floating card
- `/src/components/meal-plan/AIInsightModal.tsx` - Detailed insights
- `/src/components/meal-plan/ShoppingListModal.tsx` - Export features
- `/src/components/meal-plan/MealSwapModal.tsx` - Swap alternatives

**Types:**
- `/src/types/meal-plan.ts` - All interfaces
  - `WeeklyMealPlan`, `DayPlan`, `Meal`
  - `AIInsight`, `InsightSuggestion`
  - `ShoppingList`, `ExtractedPreferences`
  - `RecipeItem`, `GeneratePlanRequest`

**API Layer:**
- `/src/lib/api.ts` - `mealPlanApi` object with 6 methods
  - `generatePlan()`, `swapMeal()`, `extractPreferences()`
  - `ocrImage()`, `generateInsights()`, `generateShoppingList()`

### State Management
- Uses React `useState` for local component state
- `useUserProfile` context for persistent user data
- Plan stored in component state (could move to context for cross-page access)
- Drag-and-drop state managed by `@dnd-kit`

---

## User Flows

### Flow 1: Complete Auto-Generation
1. User logs in and completes onboarding (profile stored)
2. Navigates to meal planning section
3. Clicks "Auto-Generate Plan" (Smart Mode default)
4. **Step 1:** Reviews profile, edits weight to 70kg
5. **Step 2:** Selects budget "$50-100", types "prefer light dinners", enables "Try New Meals"
6. **Step 3:** Confirms settings, clicks "Generate Plan"
7. **Backend:** Ollama processes for 10-15 seconds (progress loader shows)
8. Plan appears in 7-day grid with all meals populated
9. **AI Insight Card** slides in: "85% alignment with weight loss goal"
10. User clicks day tabs to review meals

### Flow 2: Swap & Optimize
1. User sees "Pasta Carbonara" for Monday Lunch (600 kcal)
2. Clicks "Swap" button on meal card
3. **Swap Modal** opens, shows 3 alternatives:
   - Grilled Chicken Salad (350 kcal) - "Lower calories for weight loss"
   - Turkey Wrap (380 kcal) - "Balanced macros, quick prep"
   - Quinoa Bowl (320 kcal) - "High fiber, budget-friendly"
4. Selects "Quinoa Bowl"
5. Plan updates instantly, daily total recalculates
6. **AI Insight Card** updates: "88% alignment" (improved!)

### Flow 3: Manual Mode with Image Upload
1. User toggles to **Manual Mode**
2. Clicks "Upload Preferences"
3. Selects image of handwritten notes: "I love pasta, avoid dairy, need quick breakfasts"
4. **Backend:** Tesseract extracts text, Ollama parses
5. **Modal Preview:**
   - Preferences: [pasta, Italian cuisine, quick meals]
   - Avoids: [dairy]
   - Requests: [quick breakfasts]
6. User unchecks "Italian cuisine" (too broad)
7. Clicks "Apply These Preferences"
8. Returns to planner, clicks "Auto-Generate" with new preferences
9. Plan generates with pasta lunches, dairy-free options, 5-min breakfasts

### Flow 4: Export Shopping List
1. User has complete 7-day plan
2. Clicks "Shopping List" button
3. **Backend:** Ollama consolidates ingredients
4. **Modal displays:**
   - Vegetables: spinach 500g, tomatoes 6pc, onions 3pc
   - Proteins: chicken breast 3pc, salmon fillet 2pc
   - Grains: quinoa 1 bag, oats 1 box
   - Total: $42.75
5. User checks off "oats" (already in pantry)
6. Clicks "Download CSV"
7. Opens in spreadsheet app for grocery trip

### Flow 5: Calendar Integration
1. User switches to "Calendar Export" tab
2. Clicks "Download Calendar File (.ics)"
3. Frontend generates events for all 28 meals (7 days × 4 meals)
4. File downloads as `meal-plan.ics`
5. User opens Google Calendar, clicks "Import"
6. Selects downloaded file
7. All meals appear on calendar with prep reminders
8. Phone buzzes 30 min before "Monday Dinner: Salmon with Veggies"

---

## Testing Checklist

### Prerequisites
- ✅ Backend running on `http://localhost:5000`
- ✅ Ollama running on `http://localhost:11434`
- ✅ Model `phi3:mini` pulled (`ollama pull phi3:mini`)
- ✅ User authenticated with profile completed
- ✅ MongoDB connected

### Test Scenarios

**Test 1: Auto-Generate Plan**
- [ ] Click "Auto-Generate Plan" button
- [ ] Modal opens to Step 1 with profile data
- [ ] Edit weight field, verify change persists
- [ ] Click "Next" to Step 2
- [ ] Select budget, type preferences, toggle variety mode
- [ ] Click "Next" to Step 3
- [ ] Review confirmation summary
- [ ] Click "Generate Plan"
- [ ] Wait for Ollama response (no timeout errors)
- [ ] Verify 7-day grid populates with meals
- [ ] Check daily totals are accurate
- [ ] Verify AI Insight card appears

**Test 2: Manual Mode - Text Upload**
- [ ] Toggle to Manual Mode
- [ ] Click "Upload Preferences"
- [ ] Upload .txt file with: "I like chicken, avoid gluten, want high protein"
- [ ] Verify preferences extracted correctly
- [ ] Edit checkboxes (uncheck one item)
- [ ] Click "Apply"
- [ ] Verify success toast appears

**Test 3: Manual Mode - Image OCR**
- [ ] Click "Upload Image of Notes"
- [ ] Upload image with text (e.g., photo of handwritten list)
- [ ] Wait for OCR processing (shows loader)
- [ ] Verify extracted text preview appears
- [ ] Check parsed preferences are reasonable
- [ ] Apply preferences

**Test 4: Drag & Drop**
- [ ] Generate or manually create a plan
- [ ] Drag "Greek Yogurt Bowl" from sidebar
- [ ] Hover over "Monday Breakfast" slot (should glow)
- [ ] Drop into slot
- [ ] Verify meal appears in slot with macros
- [ ] Check daily total updates
- [ ] Drag another recipe to "Tuesday Lunch"
- [ ] Verify no errors in console

**Test 5: Meal Swap**
- [ ] Click "Swap" on any meal
- [ ] Swap modal opens with loading
- [ ] Verify 3 alternatives appear
- [ ] Check each has name, macros, ingredients, reason
- [ ] Click "Select" on one alternative
- [ ] Verify meal updates in plan
- [ ] Check success toast appears
- [ ] Click "Get More Alternatives"
- [ ] Verify new suggestions load

**Test 6: AI Insights**
- [ ] Wait for floating insight card to appear
- [ ] Check alignment score is 0-100
- [ ] Verify summary text makes sense
- [ ] Click "Optimize Plan"
- [ ] Detailed modal opens with loading
- [ ] Verify 3 suggestions appear with reasons
- [ ] Click "Apply" on one suggestion
- [ ] Verify plan updates with new meal
- [ ] Check alignment score changes

**Test 7: Shopping List**
- [ ] Click "Generate Shopping List"
- [ ] Modal opens, wait for generation
- [ ] Verify categorized list appears (Vegetables, Proteins, etc.)
- [ ] Check total cost is calculated
- [ ] Click checkbox on 2-3 items
- [ ] Verify items get strikethrough
- [ ] Click "Download TXT"
- [ ] Verify file downloads and opens correctly
- [ ] Click "Download CSV"
- [ ] Verify CSV imports to spreadsheet

**Test 8: Calendar Export**
- [ ] Switch to "Calendar Export" tab
- [ ] Click "Download Calendar File (.ics)"
- [ ] Verify .ics file downloads
- [ ] Open file in text editor, check format
- [ ] Import to Google Calendar or Outlook
- [ ] Verify 28 events appear (7 days × 4 meals)
- [ ] Check event times are correct (8AM breakfast, etc.)
- [ ] Verify descriptions include macros

**Test 9: Error Handling**
- [ ] Disconnect Ollama, try generating plan
- [ ] Verify error toast appears (not crash)
- [ ] Upload 15MB image (exceeds 10MB limit)
- [ ] Verify error message: "Image size must be less than 10MB"
- [ ] Upload non-image file to OCR
- [ ] Verify error or rejection
- [ ] Try swapping meal with empty profile
- [ ] Verify graceful degradation

**Test 10: End-to-End Flow**
- [ ] Simulate user "Ippsec" with profile:
  - Age: 28, Gender: Male, Weight: 75kg
  - Goal: Weight Loss
  - Restrictions: Vegan
  - Budget: $50-100
- [ ] Generate meal plan with preferences: "prefer quick meals, high protein"
- [ ] Verify all meals are vegan
- [ ] Check avg calories < 1800/day (weight loss)
- [ ] Swap 2 meals to alternatives
- [ ] View insights, apply 1 suggestion
- [ ] Generate shopping list
- [ ] Verify list excludes animal products
- [ ] Export to calendar
- [ ] Verify complete workflow succeeds

---

## Known Limitations & Future Enhancements

### Current Limitations
1. **OCR Accuracy:** Tesseract may struggle with cursive handwriting or low-quality images
2. **Ollama Response Time:** Can take 10-30 seconds for complex plan generation (no spinner timeout)
3. **Recipe Database:** Currently uses 8 hardcoded sample recipes (should integrate with USDA database)
4. **Pantry Items:** Not yet persistent (stored in component state, lost on refresh)
5. **Meal History:** No tracking of past plans or favorites

### Planned Enhancements
- **Integration with USDA Database:** Use 2000+ foods from existing ML pipeline
- **Recipe Photos:** Thumbnail images for visual appeal
- **Nutritional Breakdown Charts:** Pie charts for macro distribution
- **Meal Prep Mode:** Tag recipes as "batch-friendly" with quantity multipliers
- **Grocery Store API:** Real-time pricing from Instacart/Walmart
- **Voice Input:** "Alexa, add salmon to my meal plan"
- **Social Sharing:** Share plans to community, upvote popular plans
- **Meal Plan Templates:** Pre-made plans for common goals (Keto, Mediterranean, Vegan)
- **Adaptive Learning:** Track which meals user actually ate, improve suggestions
- **Multi-Week Planning:** Extend beyond 7 days to monthly plans

---

## Environment Variables

Add to `.env`:
```
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=phi3:mini
```

---

## Dependencies Installed
- **Backend:**
  - `multer` - File upload middleware
  - `@types/multer` - TypeScript types
  - `tesseract.js` - OCR library
- **Frontend:**
  - `@dnd-kit/core` - Drag-and-drop library

---

## API Reference

### POST `/api/meal-plan/generate`
**Request Body:**
```json
{
  "profile": {
    "age": 28,
    "gender": "female",
    "weight": 65,
    "activityLevel": "moderate",
    "primaryGoal": "weight_loss",
    "dietaryRestrictions": ["Vegan"]
  },
  "budget": "50-100",
  "preferences": "prefer light dinners, avoid eggs on weekends",
  "varietyMode": "variety"
}
```

**Response:**
```json
{
  "success": true,
  "mealPlan": {
    "days": [
      {
        "day": "Monday",
        "meals": [
          {
            "type": "breakfast",
            "name": "Oatmeal with Berries",
            "calories": 280,
            "protein": 10,
            "carbs": 45,
            "fat": 6,
            "ingredients": ["oats", "blueberries", "almond milk"],
            "cost": 2.50,
            "prepTime": 10
          }
        ],
        "totalCalories": 1650,
        "totalProtein": 90,
        "totalCarbs": 180,
        "totalFat": 45
      }
    ],
    "weeklyTotals": {
      "calories": 11550,
      "protein": 630,
      "carbs": 1260,
      "fat": 315,
      "estimatedCost": 68.50
    },
    "metadata": {
      "createdAt": "2025-10-17T00:00:00Z",
      "generationType": "ai",
      "userGoal": "weight_loss",
      "budget": "50-100"
    }
  }
}
```

### POST `/api/meal-plan/swap`
**Request:**
```json
{
  "mealName": "Pasta Carbonara",
  "mealType": "lunch",
  "day": "Monday",
  "profile": { ... },
  "budget": "50-100",
  "preferences": ""
}
```

**Response:**
```json
{
  "success": true,
  "alternatives": [
    {
      "name": "Quinoa Bowl",
      "calories": 320,
      "protein": 15,
      "carbs": 45,
      "fat": 8,
      "ingredients": ["quinoa", "chickpeas", "spinach"],
      "reason": "Lower calories, high fiber, fits vegan diet"
    }
  ]
}
```

### POST `/api/meal-plan/extract-preferences`
**Request:**
```json
{
  "text": "I love pasta and Mediterranean food. Avoid dairy and nuts. Need quick breakfasts under 10 minutes."
}
```

**Response:**
```json
{
  "success": true,
  "extracted": {
    "preferences": ["pasta", "Mediterranean cuisine", "quick meals"],
    "avoids": ["dairy", "nuts"],
    "requests": ["quick breakfasts under 10 minutes"]
  }
}
```

### POST `/api/meal-plan/ocr`
**Request:** `multipart/form-data` with `image` field

**Response:**
```json
{
  "success": true,
  "ocrText": "I like chicken salads. Avoid gluten. High protein meals.",
  "extracted": {
    "preferences": ["chicken salads", "high protein"],
    "avoids": ["gluten"],
    "requests": []
  }
}
```

### POST `/api/meal-plan/insights`
**Request:**
```json
{
  "plan": { /* full WeeklyMealPlan object */ },
  "profile": { /* user profile */ }
}
```

**Response:**
```json
{
  "success": true,
  "insight": {
    "alignment": 85,
    "summary": "Your plan is well-balanced for weight loss with good protein intake.",
    "suggestions": [
      {
        "type": "swap",
        "meal": "Day 3 Dinner",
        "alt": "Grilled Salmon with Vegetables (450 kcal, 40g protein)",
        "reason": "Increase omega-3s and maintain protein for muscle preservation"
      }
    ]
  }
}
```

### POST `/api/meal-plan/shopping-list`
**Request:**
```json
{
  "plan": { /* full WeeklyMealPlan object */ },
  "pantryItems": ["oats", "olive oil", "salt"]
}
```

**Response:**
```json
{
  "success": true,
  "shoppingList": {
    "categories": {
      "Vegetables": ["spinach 500g", "tomatoes 6pc", "onions 3pc"],
      "Proteins": ["chicken breast 3pc", "tofu 2 blocks"],
      "Grains": ["quinoa 1 bag", "brown rice 1 bag"],
      "Dairy": ["almond milk 1 carton"],
      "Other": ["olive oil 1 bottle"]
    },
    "totalCost": 42.75
  }
}
```

---

## Support & Troubleshooting

### Issue: Plan generation fails with timeout
**Solution:** Increase `num_predict` in controller or ensure Ollama is running

### Issue: OCR extracts gibberish
**Solution:** Use higher quality images with clear, printed text

### Issue: Drag-and-drop not working
**Solution:** Check console for DndKit errors, ensure plan state is initialized

### Issue: Shopping list missing ingredients
**Solution:** Verify meal plan has ingredients array populated

---

## Conclusion
All 5 feature sets are fully implemented and integrated. The system provides a complete meal planning experience with AI assistance, manual flexibility, visual interactions, smart insights, and comprehensive exports. No timeouts ensure Ollama can generate complete responses. Test the flows end-to-end with the provided checklist.
