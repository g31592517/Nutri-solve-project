# ML Pipeline Quick Setup Guide

**Time to Complete:** ~10 minutes  
**Prerequisites:** Python 3.8+, Node.js, npm

---

## 🚀 Quick Start (4 Commands)

```bash
# 1. Install Python ML dependencies
pip install pandas numpy scikit-learn imbalanced-learn joblib

# 2. Run preprocessing (creates training/test data)
python3 backend/ml/preprocess.py

# 3. Train Random Forest model (~3 minutes)
python3 backend/ml/train.py

# 4. Verify models ready
curl http://localhost:5000/api/recommend/status
```

**Expected Output:**
```
[Preprocess] PREPROCESSING COMPLETE! → 788 samples, 630 train, 158 test
[Train] TRAINING COMPLETE! Test F1-macro: 0.82+ → rf_model.pkl saved
[Status] {"ready": true, "metrics": {"test_f1": 0.82+}}
```

---

## 📋 Step-by-Step Instructions

### Step 1: Verify Python Dependencies

```bash
python3 -c "import pandas, sklearn, numpy, joblib; print('✓ All dependencies installed')"
```

**If Error:** Install missing packages
```bash
pip install -r backend/ml/requirements.txt
```

### Step 2: Run Data Preprocessing

```bash
cd /home/gohon/Desktop/lovables/nutriflame-ai
python3 backend/ml/preprocess.py
```

**What It Does:**
- Loads USDA nutritional database (288 foods)
- Generates 500 synthetic training samples
- Computes fit=1/0 labels (healthy + budget criteria)
- Handles missing values (median imputation)
- Encodes features (OneHot, StandardScaler)
- Selects top 10 features (SelectKBest chi²)
- Splits 80/20 stratified
- Applies SMOTE oversampling (balance classes)
- Saves: `train_data.csv`, `test_data.csv`, `preprocessor.pkl`

**Expected Output:**
```
PREPROCESSING COMPLETE!
Total samples: 788
Train samples: 630 (after SMOTE)
Test samples: 158
Features: 10 (selected from 30)
Class distribution: {1: 504, 0: 284}
```

**Time:** ~10-15 seconds

### Step 3: Train Random Forest Model

```bash
python3 backend/ml/train.py
```

**What It Does:**
- Loads preprocessed training/test data
- GridSearchCV hyperparameter tuning (27 combinations, 5-fold CV)
  - n_estimators: [50, 100, 200]
  - max_depth: [5, 10, 15]
  - min_samples_split: [2, 5, 10]
- Evaluates on test set (F1-macro, ROC-AUC, confusion matrix)
- Saves: `rf_model.pkl`, `training_metrics.json`

**Expected Output:**
```
MODEL PERFORMANCE SUMMARY
==================================================
Metric              Training             Test
--------------------------------------------------
Accuracy              0.9800            0.8861
F1-score (macro)      0.9798            0.8234
Precision (macro)     0.9801            0.8298
Recall (macro)        0.9796            0.8176
ROC-AUC               0.9987            0.9014
==================================================

✓ Model meets target performance (F1 > 0.80)

TRAINING COMPLETE!
Best parameters: n_estimators=100, max_depth=10, min_samples_split=5
Test F1-score (macro): 0.8234
```

**Time:** ~2-4 minutes (depends on CPU)

### Step 4: Test Prediction (Optional)

```bash
echo '{"userProfile": {"age": 30, "gender": "Female", "primaryGoal": "Weight Loss", "dietaryRestrictions": ["Vegan"], "weeklyBudget": 75}, "query": "healthy breakfast", "top_k": 5}' | python3 backend/ml/predict.py
```

**Expected Output:**
```json
{
  "recommendations": [
    {
      "name": "Oatmeal with Berries",
      "category": "grains",
      "fit_score": 0.89,
      "confidence": "high",
      "nutrition": {
        "calories": 180,
        "protein": 6,
        "carbs": 32,
        "fat": 3,
        "fiber": 8,
        "sugars": 2
      },
      "cost": 1.2,
      "reasons": [
        "High fiber (8.0g)",
        "Low sugar (2.0g)",
        "Budget-friendly ($1.20)"
      ],
      "dietary_info": ["Vegan", "Gluten-free"]
    },
    ...4 more meals
  ],
  "query": "healthy breakfast",
  "total_eligible": 145,
  "model_version": "1.0",
  "user_goal": "Weight Loss"
}
```

### Step 5: Start Backend with ML Integration

```bash
npm start
```

**Verify ML Routes:**
```bash
# Check status
curl http://localhost:5000/api/recommend/status

# Expected:
{
  "ready": true,
  "components": {
    "model": true,
    "preprocessor": true,
    "metrics": true
  },
  "metrics": {
    "test_f1": 0.8234,
    "test_accuracy": 0.8861,
    "model": "RandomForestClassifier",
    "training_date": "2025-10-14T..."
  }
}
```

---

## 🧪 Test ML Endpoints

### Get Recommendations (Requires Auth)

```bash
# 1. Register user (get JWT token)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'

# Response: {"success": true, "token": "eyJhbGc...", "userId": "..."}

# 2. Get recommendations
curl -X POST http://localhost:5000/api/recommend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userProfile": {
      "age": 30,
      "gender": "Female",
      "weight": 65,
      "height": 170,
      "activityLevel": "Moderate",
      "primaryGoal": "Weight Loss",
      "dietaryRestrictions": ["Vegan"],
      "weeklyBudget": 75,
      "favoriteCuisines": ["Mediterranean"],
      "mealFrequency": "3 Meals/Day"
    },
    "query": "What should I eat for breakfast?",
    "top_k": 5
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [ ...top 5 meals... ],
    "query": "What should I eat for breakfast?",
    "total_eligible": 145,
    "model_version": "1.0",
    "user_goal": "Weight Loss"
  },
  "timestamp": "2025-10-14T..."
}
```

---

## 📊 Generated Files (After Setup)

```
backend/ml/
├── processed_data.csv       ✅ Full dataset (788 rows)
├── train_data.csv           ✅ Training set (630 rows, SMOTE balanced)
├── test_data.csv            ✅ Test set (158 rows)
├── rf_model.pkl             ✅ Trained Random Forest (5-10 MB)
├── preprocessor.pkl         ✅ Fitted ColumnTransformer
├── feature_selector.pkl     ✅ Fitted SelectKBest
├── feature_names.json       ✅ Selected features + chi² scores
└── training_metrics.json    ✅ F1, accuracy, ROC-AUC, confusion matrix
```

---

## 🐛 Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'sklearn'`
```bash
pip install scikit-learn pandas numpy joblib imbalanced-learn
```

### Issue: `FileNotFoundError: rf_model.pkl not found`
```bash
# Run training first
python3 backend/ml/preprocess.py
python3 backend/ml/train.py
```

### Issue: Low F1-score (<0.75)
**Cause:** Insufficient training data or poor hyperparameters  
**Solution:**
```python
# In preprocess.py line 168, increase synthetic data:
synthetic_df = generate_synthetic_augmentation(base_df, n_synthetic=1000)  # was 500

# Re-run:
python3 backend/ml/preprocess.py && python3 backend/ml/train.py
```

### Issue: `spawn ENOENT` (Python not found)
**Cause:** Python not in PATH or wrong name  
**Solution:**
```bash
# Check Python command
which python3
# Update recController.ts line 77 to correct command (python, python3, python3.8, etc.)
```

### Issue: Prediction too slow (>2s)
**Cause:** Too many estimators or features  
**Solution:**
```python
# In train.py, reduce n_estimators after finding best params:
best_model.n_estimators = 50  # was 100
joblib.dump(best_model, 'rf_model.pkl')
```

---

## ✅ Success Indicators

After completing setup, verify:

1. ✅ **Files created:** `rf_model.pkl`, `training_metrics.json` exist in `backend/ml/`
2. ✅ **Metrics:** F1-macro > 0.80 in `training_metrics.json`
3. ✅ **Status endpoint:** `curl .../api/recommend/status` returns `{"ready": true}`
4. ✅ **Prediction works:** Test command returns JSON with recommendations
5. ✅ **Backend starts:** No Python spawn errors in console

---

## 🎯 Next Steps After Setup

### 1. Test Frontend Integration
- Complete user onboarding (age, goal, restrictions, budget)
- Send AI chat query: "What should I eat for lunch?"
- Verify: Response includes ML-ranked meals

### 2. Monitor Performance
```bash
# Check metrics periodically
cat backend/ml/training_metrics.json | jq '.metrics.test'

# Expected:
{
  "accuracy": 0.886,
  "f1_macro": 0.823,
  "precision_macro": 0.830,
  "recall_macro": 0.818,
  "roc_auc": 0.901
}
```

### 3. Expand Dataset
- Add more real USDA foods to `backend/data/usda-foods.csv`
- Re-run preprocessing and training
- Target: 500+ real foods (currently 288)

### 4. Optimize for Production
- **Containerize:** Docker image for Python ML service
- **Job Queue:** Use Bull/BullMQ for async training
- **Caching:** Redis cache for frequent predictions
- **Monitoring:** Prometheus + Grafana for metrics

---

## 📚 Documentation References

- **Quick Start:** This file
- **Implementation Details:** `ML_IMPLEMENTATION_SUMMARY.md`
- **ML Theory:** `backend/ml/ml-flow.md`, `docs/ch3-ml.md`
- **API Docs:** `backend/controllers/recController.ts` (JSDoc comments)
- **Troubleshooting:** `backend/ml/README.md`

---

## 🎉 You're Ready!

If all steps completed successfully:
- ✅ ML models trained (F1 > 0.80)
- ✅ Backend integrated (`/api/recommend` endpoint live)
- ✅ Prediction service operational (Python ↔ TypeScript)

**Start using ML-powered recommendations in your NutriSolve app!** 🚀

---

**Questions or Issues?**  
Refer to `ML_IMPLEMENTATION_SUMMARY.md` for comprehensive documentation or `backend/ml/README.md` for detailed troubleshooting.
