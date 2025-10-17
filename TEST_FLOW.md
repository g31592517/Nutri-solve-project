# End-to-End Test Flow for NutriSolve

## Prerequisites Checklist

### 1. Environment Setup
- [ ] MongoDB running on `localhost:27017`
  ```bash
  # Check MongoDB status
  mongosh --eval "db.runCommand({ping: 1})"
  # If not running, start it:
  sudo systemctl start mongod
  # Or on Mac:
  brew services start mongodb-community
  ```

- [ ] Ollama running on `localhost:11434`
  ```bash
  # Check Ollama status
  curl http://localhost:11434
  # If not running, start it:
  ollama serve
  ```

- [ ] Model downloaded
  ```bash
  # Pull the model if not already done
  ollama pull phi3:mini
  ```

- [ ] Dependencies installed
  ```bash
  npm install
  ```

- [ ] `.env` file exists (copy from `.env.example` if needed)
  ```bash
  cp .env.example .env
  ```

### 2. Start Services
```bash
# Single command to start both frontend and backend
npm start

# This runs:
# - Backend on http://localhost:5000
# - Frontend on http://localhost:5173
```

Wait for both services to start:
- Backend should show: `[Server] Running on http://localhost:5000`
- Frontend should show: `VITE vX.X.X ready in XXX ms`

---

## Test Flow

### Phase 1: User Registration & Auto-Login

#### Test 1.1: New User Registration
1. **Open browser** to `http://localhost:5173`
2. **Click "Sign Up"** or "Get Started" button
3. **Fill registration form:**
   - Email: `ippsec13@gmail.com`
   - Username: `Ippsec`
   - Password: `SecurePass123!`
4. **Click "Create Account"**

**Expected Results:**
- ✅ Success toast: "Registration successful! You are now logged in."
- ✅ Modal closes automatically
- ✅ User sees their username in navigation/profile area
- ✅ Console logs (open DevTools F12):
  ```
  [Auth] ✅ Auto-login enabled - token saved to localStorage
  ```
- ✅ Backend logs (check terminal):
  ```
  [Auth] ✅ User registered successfully: {
    id: '...',
    email: 'ippsec13@gmail.com',
    username: 'Ippsec',
    createdAt: ...
  }
  [Auth] 🔑 JWT token generated for user: Ippsec
  ```

#### Test 1.2: Verify Database Storage
**In terminal, run:**
```bash
mongosh nutrisolve --eval "db.users.find({email: 'ippsec13@gmail.com'}).pretty()"
```

**Expected Output:**
```javascript
{
  _id: ObjectId("..."),
  email: "ippsec13@gmail.com",
  username: "Ippsec",
  password: "$2b$10$..." // Hashed password
  createdAt: ISODate("..."),
  updatedAt: ISODate("..."),
  __v: 0
}
```

#### Test 1.3: Auto-Login on Page Reload
1. **In browser, press F5** (or Ctrl+R / Cmd+R to reload)
2. Wait for page to reload

**Expected Results:**
- ✅ User remains logged in (no login modal appears)
- ✅ Username still visible in navigation
- ✅ Console logs:
  ```
  [Auth] 🔍 Verifying stored token for auto-login...
  [Auth] ✅ Auto-login successful: Ippsec
  ```

#### Test 1.4: Session Persistence Across Browser Restarts
1. **Close the browser completely** (not just the tab)
2. **Reopen browser** and go to `http://localhost:5173`

**Expected Results:**
- ✅ User is still logged in automatically
- ✅ Token retrieved from localStorage
- ✅ No need to re-enter credentials

---

### Phase 2: Complete Onboarding Flow

#### Test 2.1: User Profile Setup
1. After registration, **onboarding modal should appear**
2. **Fill Step 1 (Basic Info):**
   - Age: `28`
   - Gender: `Male`
   - Height: `175` cm
   - Weight: `75` kg
   - Activity Level: `Moderate`
3. **Click "Next"**
4. **Fill Step 2 (Goals & Restrictions):**
   - Primary Goal: `Weight Loss`
   - Dietary Restrictions: Check `Vegan`
   - Weekly Budget: `$50-100`
5. **Click "Next"**
6. **Fill Step 3 (Preferences):**
   - Favorite Cuisines: Select `Italian`, `Asian`
   - Meal Frequency: `3 meals per day`
7. **Click "Complete Onboarding"**

**Expected Results:**
- ✅ Modal closes
- ✅ Profile data saved to localStorage
- ✅ User can now access all features

---

### Phase 3: AI Chat Functionality Test

#### Test 3.1: Send Chat Query
1. **Navigate to AI Chat section** (scroll down or click menu)
2. **Type in chat input:**
   ```
   Suggest a budget meal plan for nut allergies and weight loss
   ```
3. **Click Send** or press Enter

**Expected Results:**
- ✅ Message appears in chat with user avatar
- ✅ Loading indicator shows (typing animation)
- ✅ Backend logs:
  ```
  [Chat] 🤖 Sending query to Ollama: Suggest a budget meal plan for nut allergies...
  ```
- ✅ **Wait for full response (NO TIMEOUT)**
  - May take 10-30 seconds depending on system
  - Loading indicator should remain visible
- ✅ Response appears in chat:
  ```
  🍎 Here's a budget-friendly meal plan for nut-free weight loss:

  Breakfast: Oatmeal with berries ($2.50, 280 kcal)
  Lunch: Grilled chicken salad ($4.00, 350 kcal)
  Dinner: Baked salmon with veggies ($6.50, 450 kcal)
  Snack: Greek yogurt ($1.50, 150 kcal)

  Total: ~$15/day, 1230 kcal
  High protein for satiety 💪
  ```
- ✅ Backend logs:
  ```
  [Chat] ✅ Ollama response received: 🍎 Here's a budget-friendly meal plan...
  [Chat] ⏱️  Response time: 12543 ms
  ```

#### Test 3.2: Follow-up Query
1. **Send another message:**
   ```
   What about breakfast alternatives under 200 calories?
   ```

**Expected Results:**
- ✅ Receives relevant response with breakfast suggestions
- ✅ Uses RAG context from USDA database
- ✅ Response is complete and well-formatted

#### Test 3.3: Test Cache
1. **Scroll up and copy the first query exactly:**
   ```
   Suggest a budget meal plan for nut allergies and weight loss
   ```
2. **Send it again**

**Expected Results:**
- ✅ Response returns instantly (< 100ms)
- ✅ Same response as before (from cache)
- ✅ Response shows `cached: true` in network tab

---

### Phase 4: Meal Planning Features Test

#### Test 4.1: Auto-Generate Meal Plan
1. **Scroll to "Weekly Meal Planner" section**
2. **Ensure "Smart Mode" toggle is enabled** (🤖 icon)
3. **Click "Auto-Generate Plan"**
4. **Modal opens - Step 1:**
   - Verify profile shows: Age 28, Male, 75kg, Moderate, Weight Loss, Vegan
   - Make no changes (or adjust weight to test)
5. **Click "Next" - Step 2:**
   - Budget: Keep `$50-100`
   - Preferences: Type `prefer light dinners, avoid soy`
   - Variety: Toggle ON (Try New Meals)
6. **Click "Next" - Step 3:**
   - Review confirmation summary
7. **Click "Generate Plan"**

**Expected Results:**
- ✅ Loading spinner shows "Generating..."
- ✅ **Wait 15-30 seconds for Ollama** (no timeout)
- ✅ Backend logs:
  ```
  [MealPlan] Generating meal plan via Ollama...
  [MealPlan] Ollama response received, parsing JSON...
  ```
- ✅ Modal closes
- ✅ 7-day grid populates with meals
- ✅ Each day shows 4 meals (Breakfast, Lunch, Dinner, Snack)
- ✅ Daily totals displayed (Calories, Protein, Carbs, Fat)
- ✅ All meals are vegan (no animal products)
- ✅ Avg daily calories ~1600-1800 (weight loss target)
- ✅ Success toast: "Meal plan generated! 🎉"

#### Test 4.2: Drag & Drop Recipe
1. **Look at left sidebar** - "Suggested Recipes"
2. **Drag "Greek Yogurt Bowl"** (or any recipe)
3. **Hover over "Monday Breakfast" slot**
   - Slot should glow green
4. **Drop the recipe**

**Expected Results:**
- ✅ Recipe appears in Monday Breakfast
- ✅ Macros update (calories, protein, etc.)
- ✅ Daily total recalculates
- ✅ Toast: "Greek Yogurt Bowl added to Monday breakfast! 🎯"

#### Test 4.3: Swap Meal
1. **Find any populated meal** (e.g., Tuesday Lunch)
2. **Click "Swap" button** on meal card
3. **Modal opens** with loading
4. **Wait for 3 alternatives** to appear

**Expected Results:**
- ✅ Modal shows 3 meal alternatives
- ✅ Each shows: name, macros, ingredients, reason
- ✅ Click "Select" on one alternative
- ✅ Meal updates in plan
- ✅ Toast: "Meal swapped! 🔄"

#### Test 4.4: AI Insight
1. **Wait 2 seconds** after plan generation
2. **Floating card appears** bottom-right

**Expected Results:**
- ✅ Card shows alignment score (e.g., "85%")
- ✅ Shows brief summary
- ✅ "Optimize Plan" button visible
- ✅ Click "Optimize Plan"
- ✅ Modal opens with detailed insights
- ✅ Shows 3 suggestions with reasons
- ✅ Click "Apply" on one suggestion
- ✅ Plan updates, alignment score changes

#### Test 4.5: Shopping List Export
1. **Click "Shopping List"** button
2. **Modal opens** with loading
3. **Wait for list generation**

**Expected Results:**
- ✅ Categorized list appears (Vegetables, Proteins, etc.)
- ✅ Total cost shown (e.g., "$42.75")
- ✅ Check 2-3 items (should strikethrough)
- ✅ Click "Download TXT"
- ✅ File `shopping-list.txt` downloads
- ✅ Open file - verify contents are correct

#### Test 4.6: Calendar Export
1. **Switch to "Calendar Export" tab**
2. **Click "Download Calendar File (.ics)"**

**Expected Results:**
- ✅ File `meal-plan.ics` downloads
- ✅ Open in text editor - verify ICS format
- ✅ Import to Google Calendar or Outlook
- ✅ 28 events appear (7 days × 4 meals)
- ✅ Events have correct times (8AM breakfast, etc.)
- ✅ Reminders set for 30 min before

---

### Phase 5: Manual Mode & OCR Test

#### Test 5.1: Manual Mode - Text Upload
1. **Toggle to "Manual Mode"** (toggle switch)
2. **Click "Upload Preferences"**
3. **Create test file:**
   ```bash
   echo "I love pasta and Mediterranean food. Avoid dairy and nuts. Need quick breakfasts under 10 minutes." > preferences.txt
   ```
4. **Upload `preferences.txt`**

**Expected Results:**
- ✅ Loading indicator shows
- ✅ Preview modal appears
- ✅ Preferences detected:
  - Likes: pasta, Mediterranean cuisine, quick meals
  - Avoids: dairy, nuts
  - Requests: quick breakfasts under 10 minutes
- ✅ Click "Apply These Preferences"
- ✅ Toast: "Preferences applied! ✅"

#### Test 5.2: Manual Mode - Image OCR
1. **Take photo of handwritten note:**
   ```
   I like chicken salads
   Avoid gluten
   High protein meals
   ```
2. **Click "Upload Image of Notes"**
3. **Upload the photo**

**Expected Results:**
- ✅ Loading shows "Extracting your food preferences..."
- ✅ OCR text preview appears
- ✅ Preferences parsed correctly
- ✅ Apply preferences

---

### Phase 6: Error Handling Tests

#### Test 6.1: Invalid Login
1. **Logout** (if logged in)
2. **Try to login with wrong password**

**Expected Results:**
- ✅ Error toast: "Invalid email or password"
- ✅ No crash, form remains

#### Test 6.2: Duplicate Registration
1. **Try to register with existing email:** `ippsec13@gmail.com`

**Expected Results:**
- ✅ Error toast: "User with this email or username already exists"

#### Test 6.3: Ollama Disconnected
1. **Stop Ollama:**
   ```bash
   pkill ollama
   ```
2. **Try to send chat message**

**Expected Results:**
- ✅ Error toast appears (not crash)
- ✅ Message: "Failed to get response from AI"

3. **Restart Ollama:**
   ```bash
   ollama serve
   ```
4. **Try chat again** - should work

---

## Success Criteria

### ✅ Authentication & Session
- [x] User can register new account
- [x] Password is hashed in database
- [x] JWT token saved to localStorage
- [x] Auto-login works on page reload
- [x] Session persists across browser restarts
- [x] Token validation works correctly

### ✅ Database Verification
- [x] User record created in MongoDB
- [x] Can query user with mongosh
- [x] Password is bcrypt hashed (starts with $2b$)

### ✅ Chat Functionality
- [x] Can send messages to AI
- [x] Ollama generates complete responses (no timeout)
- [x] Responses render correctly in UI
- [x] RAG context from USDA database included
- [x] Cache works for duplicate queries

### ✅ Meal Planning
- [x] Auto-generate creates 7-day plan
- [x] All meals honor dietary restrictions
- [x] Drag-and-drop works smoothly
- [x] Meal swap provides alternatives
- [x] AI insights analyze plan
- [x] Shopping list exports correctly
- [x] Calendar file generates and imports

### ✅ Service Flow
- [x] Frontend and backend communicate without errors
- [x] No CORS issues
- [x] No timeout errors
- [x] All API endpoints respond correctly

---

## Troubleshooting

### Issue: MongoDB connection failed
**Solution:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod
# Start it if not running
sudo systemctl start mongod
```

### Issue: Ollama not responding
**Solution:**
```bash
# Check if Ollama is running
curl http://localhost:11434
# Start if not running
ollama serve
# In another terminal, verify model exists
ollama list
```

### Issue: Port 5000 already in use
**Solution:**
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9
# Or change PORT in .env file
```

### Issue: Frontend can't connect to backend
**Solution:**
1. Check `.env` has `FRONTEND_URL=http://localhost:5173`
2. Verify backend CORS allows localhost:5173
3. Check backend is running on port 5000

### Issue: Auto-login not working
**Solution:**
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Verify `authToken` exists
4. Check console for token verification logs

---

## Performance Benchmarks

### Expected Response Times
- **Registration:** < 500ms
- **Login:** < 300ms
- **Token Verification:** < 200ms
- **Chat Response:** 5-30s (depends on query complexity)
- **Meal Plan Generation:** 15-30s
- **Meal Swap:** 3-8s
- **Shopping List:** 2-5s

### Resource Usage
- **Backend Memory:** ~150-300 MB
- **Ollama Memory:** ~2-4 GB (with phi3:mini)
- **MongoDB Memory:** ~100-200 MB
- **Frontend (Browser):** ~100-150 MB

---

## Test Report Template

**Date:** ___________
**Tester:** ___________

| Test | Status | Notes |
|------|--------|-------|
| User Registration | ☐ Pass / ☐ Fail | |
| DB Storage Verified | ☐ Pass / ☐ Fail | |
| Auto-Login (Reload) | ☐ Pass / ☐ Fail | |
| Auto-Login (Browser Restart) | ☐ Pass / ☐ Fail | |
| Onboarding Flow | ☐ Pass / ☐ Fail | |
| Chat Query #1 | ☐ Pass / ☐ Fail | Response time: ___s |
| Chat Query #2 | ☐ Pass / ☐ Fail | Response time: ___s |
| Chat Cache | ☐ Pass / ☐ Fail | |
| Auto-Generate Plan | ☐ Pass / ☐ Fail | Generation time: ___s |
| Drag & Drop | ☐ Pass / ☐ Fail | |
| Meal Swap | ☐ Pass / ☐ Fail | |
| AI Insights | ☐ Pass / ☐ Fail | |
| Shopping List | ☐ Pass / ☐ Fail | |
| Calendar Export | ☐ Pass / ☐ Fail | |
| Manual Mode - Text | ☐ Pass / ☐ Fail | |
| Manual Mode - OCR | ☐ Pass / ☐ Fail | |
| Error Handling | ☐ Pass / ☐ Fail | |

**Overall Status:** ☐ All Pass / ☐ Some Failures

**Issues Found:**
1. 
2. 
3. 

**Additional Notes:**


---

## Quick Test Commands

```bash
# 1. Start all services
npm start

# 2. Check if services are up
curl http://localhost:5000/health
curl http://localhost:5173

# 3. Check MongoDB
mongosh --eval "db.adminCommand('ping')"

# 4. Check Ollama
curl http://localhost:11434

# 5. Test user registration via API
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test123!"}'

# 6. Test chat via API
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"message":"Suggest a healthy breakfast"}'

# 7. View backend logs in real-time
npm run start:backend | grep -E '\[Auth\]|\[Chat\]|\[MealPlan\]'

# 8. Query test user from DB
mongosh nutrisolve --eval "db.users.find({email: 'ippsec13@gmail.com'}).pretty()"
```

---

**Happy Testing! 🚀**
