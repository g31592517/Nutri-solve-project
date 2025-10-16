# Machine Learning Pipeline Flow Diagram
## Personalized Meal Recommendation System

This document visualizes the complete end-to-end machine learning pipeline for meal recommendations, from user input to AI-generated personalized responses.

---

## Complete ML Pipeline Flow

```mermaid
graph TD
    A[User Input: Query + Profile] --> B[Parse User Data]
    B --> C{Profile Complete?}
    C -->|No| D[Prompt Onboarding]
    C -->|Yes| E[Extract Features]
    
    D --> A
    
    E --> F[Load Food Database]
    F --> G[Filter by Constraints]
    
    G --> H{Dietary Restrictions?}
    H -->|Vegan| I[Filter Non-Vegan]
    H -->|Gluten-Free| J[Filter Gluten]
    H -->|Nut Allergy| K[Filter Nuts]
    H -->|None| L[All Foods]
    
    I --> M[Budget Filter]
    J --> M
    K --> M
    L --> M
    
    M --> N[Prepare Feature Matrix]
    N --> O[Apply Preprocessing]
    
    O --> P[StandardScaler]
    O --> Q[OneHot Encoder]
    O --> R[Pass Binary Flags]
    
    P --> S[Feature Selection]
    Q --> S
    R --> S
    
    S --> T[SelectKBest chi2 k=10]
    T --> U[Random Forest Predict]
    
    U --> V[Compute Fit Probabilities]
    V --> W{User Goal?}
    
    W -->|Weight Loss| X[Boost Low-Cal High-Protein]
    W -->|Muscle Gain| Y[Boost High-Protein]
    W -->|Heart Health| Z[Boost Low-Sodium High-Fiber]
    W -->|General| AA[No Adjustment]
    
    X --> AB[Rank by Probability]
    Y --> AB
    Z --> AB
    AA --> AB
    
    AB --> AC[Select Top-5 Meals]
    AC --> AD[Format Recommendations]
    
    AD --> AE[Generate Reasons]
    AE --> AF[Add Dietary Info]
    
    AF --> AG[Return JSON Response]
    AG --> AH[Feed to Ollama Context]
    
    AH --> AI[Ollama Generates Response]
    AI --> AJ[Natural Language Output]
    
    AJ --> AK[Display to User]
    
    style A fill:#e1f5fe
    style U fill:#fff3e0
    style AI fill:#f3e5f5
    style AK fill:#e8f5e9
```

---

## Detailed Component Breakdown

### 1. User Input Processing
```mermaid
graph LR
    A[User Query] --> B[Parse Text]
    C[User Profile] --> D[Extract Features]
    B --> E[Combined Input]
    D --> E
    E --> F[Validation]
```

**Features Extracted:**
- Age, gender, weight, height (numerical)
- Primary goal (categorical: Weight Loss, Muscle Gain, etc.)
- Dietary restrictions (binary flags: vegan, gluten-free, nut-free)
- Weekly budget (numerical → cost_per_serving threshold)
- Favorite cuisines (categorical, optional filter)

---

### 2. Data Preprocessing Pipeline
```mermaid
graph TD
    A[Raw Food Data] --> B{Missing Values?}
    B -->|Yes| C[Impute Median]
    B -->|No| D[Encode Categoricals]
    C --> D
    D --> E[OneHot Encode food_category]
    E --> F[Scale Numerical Features]
    F --> G[StandardScaler: mean=0 std=1]
    G --> H[Compute Derived Features]
    H --> I[nutrient_density = protein+fiber / calories]
    H --> J[sugar_to_carb_ratio = sugars / carbs]
    I --> K[Feature Matrix Ready]
    J --> K
```

**Preprocessing Techniques:**
- **Imputation**: Median for numerical (robust to outliers)
- **Scaling**: StandardScaler ensures Gini splits not dominated by high-magnitude features
- **Encoding**: OneHot for categories (drop='first' prevents multicollinearity)
- **Derived Features**: Capture non-linear nutrient relationships

---

### 3. Feature Selection Process
```mermaid
graph TD
    A[25 Initial Features] --> B[SelectKBest chi2]
    B --> C[Compute chi² Statistic]
    C --> D[chi² = Σ Observed-Expected ² / Expected]
    D --> E[Rank Features by Score]
    E --> F[Select Top 10 Features]
    F --> G[Reduced Feature Space]
    G --> H[Benefits: Less Noise Faster Training Better Generalization]
```

**Selected Features (Example):**
1. protein_g (chi²=145.2)
2. fiber_g (chi²=98.7)
3. sugars_g (chi²=87.3)
4. nutrient_density (chi²=76.5)
5. cost_per_serving (chi²=65.1)
6. calories (chi²=54.8)
7. sodium_mg (chi²=43.2)
8. sugar_to_carb_ratio (chi²=38.9)
9. food_category_grains (chi²=29.4)
10. is_vegan (chi²=21.7)

---

### 4. Random Forest Training Flow
```mermaid
graph TD
    A[Training Data X y] --> B[GridSearchCV Setup]
    B --> C[Parameter Grid]
    C --> D[n_estimators: 50 100 200]
    C --> E[max_depth: 5 10 15]
    C --> F[min_samples_split: 2 5 10]
    
    D --> G[Cross-Validation Loop]
    E --> G
    F --> G
    
    G --> H[Fold 1/5]
    G --> I[Fold 2/5]
    G --> J[Fold 3/5]
    G --> K[Fold 4/5]
    G --> L[Fold 5/5]
    
    H --> M[Compute F1-macro]
    I --> M
    J --> M
    K --> M
    L --> M
    
    M --> N[Average CV Score]
    N --> O{Best Params?}
    O -->|Yes| P[Save Best Model]
    O -->|No| G
    
    P --> Q[Final Model Ready]
```

**Training Process:**
1. **GridSearchCV**: Exhaustive search over 27 parameter combinations
2. **5-Fold CV**: Train on 4 folds, validate on 1 (rotates 5 times)
3. **Scoring**: F1-macro balances precision/recall for imbalanced classes
4. **Best Model**: Highest mean CV F1-score across all folds

---

### 5. Prediction & Ranking Logic
```mermaid
graph TD
    A[New User Query] --> B[Load Trained Model]
    B --> C[Load Food Database]
    C --> D[Apply User Filters]
    
    D --> E[Preprocess Features]
    E --> F[Model.predict_proba]
    F --> G[Get P y=1 for Each Food]
    
    G --> H{Goal Adjustment}
    H -->|Weight Loss| I[Boost Low-Cal × 1.2]
    H -->|Muscle Gain| J[Boost High-Protein × 1.3]
    H -->|Heart Health| K[Boost Low-Sodium × 1.2]
    
    I --> L[Adjusted Probabilities]
    J --> L
    K --> L
    
    L --> M[Sort Descending]
    M --> N[Select Top-5]
    N --> O[Format JSON]
    O --> P[Return Recommendations]
```

**Probability Formula:**
```
P(fit=1|food) = (1/N) Σ(i=1 to N) P_i(food|tree_i)
```
Where N = n_estimators (e.g., 100 trees)

**Adjusted Probability (for Weight Loss):**
```
P_adjusted = P_raw × 1.2  if (calories < 300 AND protein > 15g)
P_adjusted = clip(P_adjusted, 0, 1)
```

---

### 6. Integration with Ollama AI
```mermaid
graph LR
    A[Top-5 Ranked Meals] --> B[Format Context String]
    B --> C[Recommended: Quinoa 0.87 High-protein...]
    C --> D[Append to User Query]
    D --> E[Combined Prompt]
    E --> F[Send to Ollama API]
    F --> G[Ollama Generates Response]
    G --> H[Try quinoa salad: Fits vegan goal...]
    H --> I[Display to User]
```

**Context Injection Example:**
```
User Query: "I need a healthy breakfast"
ML Context: "Recommended meals (ranked by fit score):
1. Greek Yogurt Parfait (0.89): High protein (18g), low sugar (3g), budget $1.50
2. Oatmeal with Berries (0.85): High fiber (8g), vegan, budget $1.20
3. Veggie Omelet (0.82): High protein (22g), low carb (5g), budget $2.00"

Final Prompt to Ollama:
"[Context] {ML rankings} [Query] I need a healthy breakfast [Goal] Weight Loss [Restrictions] Vegan"

Ollama Output:
"Based on your goals, I recommend starting with Oatmeal with Berries! 🥣
It's high in fiber (8g) to keep you full, completely vegan, and only $1.20 per serving.
Add some chia seeds for extra protein and omega-3s. Want the recipe?"
```

---

## Mathematical Foundations

### Gini Impurity (Decision Tree Splits)
```
G(node_m) = 1 - Σ(k=1 to K) p_mk²

where:
- p_mk = proportion of class k in node m
- K = number of classes (2 for binary: fit/unfit)
```

**Example:**
- Node with 100 samples: 60 fit, 40 unfit
- G = 1 - (0.6² + 0.4²) = 1 - (0.36 + 0.16) = 0.48

**Interpretation:** Lower Gini = purer node (better split)

### Ensemble Aggregation
```
P(y=1|x) = (1/N) Σ(i=1 to N) P_i(y=1|x)

Variance Reduction:
σ_ensemble ≈ σ_tree / √N
```

**Why Bagging Works:**
- Individual trees have high variance (overfit)
- Averaging N uncorrelated predictions reduces variance by factor of √N
- For N=100 trees: variance reduced ~10x

### Feature Importance (Gini Decrease)
```
Importance_j = (1/N_trees) Σ(tree=1 to N_trees) Σ(node∈tree where j used) (samples_node / total_samples) × ΔGini

where:
- ΔGini = Gini_before_split - Gini_after_split
```

**Interpretation:** Higher importance = feature contributes more to reducing impurity across all trees

---

## Performance Metrics

### F1-Score (Harmonic Mean)
```
Precision = TP / (TP + FP)
Recall = TP / (TP + FN)
F1 = 2 × (Precision × Recall) / (Precision + Recall)
```

**Why F1 over Accuracy:**
- Accuracy misleading for imbalanced data (64% fit, 36% unfit)
- F1 balances precision (avoid false positives) and recall (find all positives)
- Macro-averaging: F1_macro = (F1_class0 + F1_class1) / 2

### ROC-AUC (Ranking Quality)
```
AUC = ∫(0 to 1) TPR(FPR) d(FPR)

where:
- TPR = True Positive Rate = TP / (TP + FN)
- FPR = False Positive Rate = FP / (FP + TN)
```

**Interpretation:**
- AUC = 0.5: Random guessing
- AUC > 0.80: Good ranking (important for top-k recommendations)
- AUC = 1.0: Perfect separation

---

## SMOTE Oversampling

```mermaid
graph LR
    A[Minority Class Samples] --> B[Find k Nearest Neighbors]
    B --> C[Select Random Neighbor]
    C --> D[Interpolate: x_new = x + λ × x_neighbor - x]
    D --> E[Generate Synthetic Sample]
    E --> F[Add to Training Set]
    F --> G[Balanced Dataset]
```

**Formula:**
```
x_synthetic = x_i + λ × (x_knn - x_i)
where λ ~ Uniform(0, 1)
```

**Why SMOTE:**
- Random oversampling duplicates → overfitting
- SMOTE creates new samples along feature space lines → generalization
- Applied only to training set (test set unchanged for unbiased eval)

---

## Error Analysis & Optimization

### Common Failure Modes
1. **Low Precision**: Too many false positives (unfit foods ranked high)
   - **Solution**: Increase min_samples_split, reduce max_depth
2. **Low Recall**: Missing fit foods (false negatives)
   - **Solution**: Increase n_estimators, apply SMOTE
3. **Overfitting**: High train F1, low test F1
   - **Solution**: Regularization via max_depth, min_samples_leaf

### Optimization Techniques Applied
- **GridSearchCV**: Exhaustive hyperparameter search
- **SMOTE**: Balance classes (64/36 → 50/50)
- **Feature Selection**: Reduce noise (25 → 10 features)
- **Cross-Validation**: 5-fold ensures robust evaluation
- **Goal Adjustment**: Post-hoc probability boost for user preferences

---

## Integration Testing Workflow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Python ML
    participant Ollama AI
    
    User->>Frontend: Submit query "healthy vegan breakfast"
    Frontend->>Backend: POST /api/recommend {profile, query}
    Backend->>Python ML: spawn('python predict.py', stdin=JSON)
    Python ML->>Python ML: Load model & data
    Python ML->>Python ML: Filter by vegan=True
    Python ML->>Python ML: Predict probabilities
    Python ML->>Python ML: Rank top-5
    Python ML->>Backend: stdout: JSON rankings
    Backend->>Backend: Parse JSON
    Backend->>Ollama AI: POST /api/chat {context=rankings, query}
    Ollama AI->>Backend: Natural language response
    Backend->>Frontend: Combined response
    Frontend->>User: Display recommendations + chat
```

---

## File Structure Summary

```
backend/ml/
├── preprocess.py        # Data preprocessing & augmentation
├── train.py             # Model training with GridSearchCV
├── predict.py           # Real-time prediction endpoint
├── ml-flow.md           # This documentation
├── processed_data.csv   # Full dataset with labels
├── train_data.csv       # Training set (after SMOTE)
├── test_data.csv        # Test set (stratified)
├── rf_model.pkl         # Trained Random Forest
├── preprocessor.pkl     # Fitted ColumnTransformer
├── feature_selector.pkl # Fitted SelectKBest
├── feature_names.json   # Feature metadata
└── training_metrics.json # Performance metrics
```

---

## Next Steps

1. **Run Pipeline**: 
   ```bash
   python backend/ml/preprocess.py
   python backend/ml/train.py
   ```

2. **Test Prediction**:
   ```bash
   echo '{"userProfile": {"primaryGoal": "Weight Loss", "dietaryRestrictions": ["Vegan"], "weeklyBudget": 75}, "query": "breakfast"}' | python backend/ml/predict.py
   ```

3. **Integrate with Backend**: See `/backend/controllers/recController.ts`

4. **Monitor Performance**: Track metrics in `training_metrics.json`

---

**Last Updated:** October 2025  
**Model Version:** 1.0  
**Target F1-Score:** > 0.80 (achieved: see training_metrics.json)
