# Quick Test Guide - Personalization & Gamification Features

## 🚀 Quick Start Testing

### 1. Initial Setup
```bash
npm run dev
# Open http://localhost:5173
```

### 2. Test User Onboarding
1. Click **"Get Started"** button in navigation
2. Fill out signup form with:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `password123`
3. Click **"Sign Up"**
4. ✅ Onboarding modal should auto-open after 500ms

### 3. Complete Onboarding Form

**Step 1 - Basic Profile:**
- Age: `30`
- Gender: `Female`
- Height: `170` cm
- Weight: `65` kg
- Activity Level: `Moderate`
- Click **"Next"**

**Step 2 - Goals & Restrictions:**
- Primary Goal: `Weight Loss`
- Check: `Vegan`, `Gluten Free`
- Budget: `$50-100`
- Click **"Next"**

**Step 3 - Preferences:**
- Check: `Italian`, `Asian`, `Mediterranean`
- Meal Frequency: `3 Meals/Day`
- Click **"Complete"**
- ✅ Should see success toast

### 4. Test Personalized AI Chat
1. Scroll to **AI Chat** section
2. Type: `"What should I eat for breakfast?"`
3. Click **Send**
4. ✅ AI response includes your context (vegan, weight loss goal)
5. ✅ "First Chat" badge unlocks (check navigation dropdown)
6. ✅ Prompt appears: "Log this meal to build your streak?"
7. Click **"Yes, Log It"**
8. Fill meal log:
   - Meal Type: `Breakfast`
   - Description: `Oatmeal with berries`
   - Calories: `350`
9. Click **"Log Meal"**
10. ✅ Streak counter appears in navigation (1 🔥)

### 5. Test Community Features
1. Scroll to **Community Hub**
2. Create a post:
   - Type: `"Just had an amazing vegan breakfast!"`
   - Click **"Share Post"**
3. ✅ "Community Starter" badge unlocks
4. ✅ Your badges appear next to your username on the post
5. Check sidebar **"Active Challenges"**
6. Click **"Join Challenge"** on "7-Day Healthy Breakfast Challenge"
7. ✅ Participant count increases

### 6. Test Educational Resources
1. Scroll to **Educational Resources**
2. Click **"Calculate Now"** on Health Calculators
3. ✅ Calculator pre-filled with your profile data (170cm, 65kg, 30yo, female)
4. Click **"Calculate BMI"**
5. ✅ See personalized BMI result
6. Switch to **"BMR Calculator"** tab
7. ✅ Pre-filled again
8. Click **"Calculate BMR"**
9. Close calculator
10. ✅ "Knowledge Seeker" badge progress (1/3)

### 7. Test User Dashboard
1. Click **profile icon** in navigation (top-right)
2. Click **"My Dashboard"**
3. ✅ See:
   - Current Streak: `1 🔥`
   - Weekly Progress: `1/7 days (14%)`
   - Primary Goal: `Weight Loss`
   - Total Points: `30 pts` (3 actions × 10 pts)
   - Badge Gallery: `3 badges` (First Chat, Community Starter, Knowledge Seeker progress)
   - Active Challenges with progress bars

### 8. Test Multi-Day Streak
To test streak continuation (fast-forward simulation):

**Option A - Manual localStorage Edit:**
1. Open browser DevTools → Console
2. Run:
```javascript
const userId = JSON.parse(localStorage.getItem('authToken')).userId;
const gam = JSON.parse(localStorage.getItem(`gamification_${userId}`));
gam.dailyActions.push({
  type: 'chat',
  timestamp: new Date(Date.now() - 24*60*60*1000).toISOString()
});
localStorage.setItem(`gamification_${userId}`, JSON.stringify(gam));
location.reload();
```

**Option B - Natural Testing:**
- Log multiple actions today
- Come back tomorrow and log another action
- ✅ Streak increments to 2, 3, etc.
- At 7 days: ✅ "Week Warrior" badge unlocks

### 9. Test All Badge Unlocks

**Quick Badge Unlock:**
1. Send 10 chat messages → `Chat Master` 🎓
2. Create 1 post → `Community Starter` 📝
3. Use calculator 3 times → `Knowledge Seeker` 📚
4. Maintain 7-day streak → `Week Warrior` 🔥
5. Log 7 budget meals → `Budget Boss` 💰

### 10. Test Mobile Responsiveness
1. Open DevTools → Toggle device toolbar
2. Select iPhone/Android device
3. ✅ Verify:
   - Navigation shows hamburger menu
   - Onboarding modal scrollable
   - Dashboard cards stack vertically
   - Challenges display properly
   - All buttons are touch-friendly
   - No horizontal scroll

---

## 🎯 Expected Results Checklist

### Personalization
- ✅ Onboarding auto-opens after signup
- ✅ Profile data saved to localStorage
- ✅ AI chat includes user context
- ✅ Calculator pre-filled with height/weight/age/gender
- ✅ Community can show user badges

### Gamification
- ✅ Streak counter in navigation
- ✅ Weekly progress bar updates
- ✅ Badges unlock automatically
- ✅ Toast notifications on achievements
- ✅ Points accumulate (10 per action)
- ✅ Challenges show progress
- ✅ Dashboard displays all stats

### UI/UX
- ✅ Smooth animations (fade-in, fade-up)
- ✅ Progress indicators on onboarding
- ✅ Clean, intuitive design
- ✅ Mobile responsive
- ✅ No console errors
- ✅ Fast loading times

---

## 🐛 Troubleshooting

### Issue: Onboarding doesn't appear
**Fix:** 
```javascript
// Clear profile in DevTools Console:
const userId = 'YOUR_USER_ID';
localStorage.removeItem(`userProfile_${userId}`);
location.reload();
```

### Issue: Badges not unlocking
**Check:**
1. Action logged? (Check DevTools → Console)
2. Criteria met? (See PERSONALIZATION_GAMIFICATION_GUIDE.md)
3. Clear gamification data and retry

### Issue: Streak not incrementing
**Verify:**
- At least one action logged today
- Check `localStorage` → `gamification_*` → `dailyActions`
- Last action was within 24 hours

### Issue: Calculator not pre-filling
**Check:**
- Profile onboarding completed?
- Height, weight, age, gender filled in profile?
- Open calculator after completing onboarding

---

## 📊 Test Metrics

After completing all tests, you should have:
- **Streak:** 1-7 days (depending on testing duration)
- **Points:** 30-100+ pts
- **Badges:** 3-9 badges unlocked
- **Actions Logged:** 10+ actions
- **Weekly Progress:** X/7 days completed
- **Challenges Joined:** 1-3 challenges

---

## 🎉 Success Indicators

Your implementation is working if:
1. ✅ No TypeScript compilation errors
2. ✅ No console errors in browser
3. ✅ All modals open/close smoothly
4. ✅ Data persists on page reload
5. ✅ Badges unlock when criteria met
6. ✅ Streak counter updates daily
7. ✅ AI chat includes personalization
8. ✅ Mobile layout looks great
9. ✅ All animations are smooth
10. ✅ User experience feels polished

---

## 🚢 Ready for Production

Before deploying:
- [ ] Test on multiple browsers (Chrome, Firefox, Safari)
- [ ] Test on real mobile devices
- [ ] Verify localStorage quota handling
- [ ] Check all animations on slow connections
- [ ] Verify badge unlock timing
- [ ] Test with different screen sizes
- [ ] Ensure WCAG accessibility compliance
- [ ] Performance audit (Lighthouse score > 90)

---

## 📝 Notes

- All data currently uses localStorage
- Backend integration ready (see API endpoints in main guide)
- User data isolated by user ID
- No external API calls (except existing AI chat)
- Zero dependencies added
- Production-ready code

---

**Need help?** Refer to `PERSONALIZATION_GAMIFICATION_GUIDE.md` for detailed documentation.
