"""
Data Preprocessing Pipeline for Meal Recommendation System
Author: NutriSolve ML Team
Date: October 2025

Research Design: Supervised binary classification for "fit score" prediction
Target: Binary label (1=fits user goals, 0=doesn't fit)
Features: 25 total (18 numerical, 5 categorical, 2 derived)

This script:
1. Loads USDA nutritional data
2. Generates synthetic augmentation for training
3. Handles missing values via median imputation
4. Encodes categorical features (OneHot)
5. Scales numerical features (StandardScaler)
6. Applies feature selection (SelectKBest chi2)
7. Balances classes via SMOTE oversampling
8. Splits data 80/20 stratified
9. Saves preprocessor and processed data
"""

import pandas as pd
import numpy as np
import json
import os
from pathlib import Path
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.feature_selection import SelectKBest, chi2
from imblearn.over_sampling import SMOTE

# Set random seed for reproducibility (as per research methodology)
RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# Define paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
ML_DIR = BASE_DIR / 'ml'

# Ensure directories exist
ML_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)

def create_sample_usda_data():
    """
    Create sample USDA nutritional database
    In production, this would be replaced with actual USDA FoodData Central data
    Format: 288 foundation foods with nutritional breakdown
    """
    print("[Preprocess] Creating sample USDA dataset...")
    
    # Food categories (10 unique for categorical encoding)
    categories = ['vegetables', 'fruits', 'grains', 'proteins', 'dairy', 
                  'nuts_seeds', 'legumes', 'beverages', 'oils', 'snacks']
    
    # Generate 288 base foods (realistic nutritional profiles)
    foods = []
    for i in range(288):
        cat = np.random.choice(categories)
        
        # Category-specific nutritional profiles
        if cat == 'vegetables':
            cal, prot, fat, carb, fib, sug = 25, 2, 0.3, 5, 2.5, 2
        elif cat == 'fruits':
            cal, prot, fat, carb, fib, sug = 60, 0.8, 0.2, 15, 2, 10
        elif cat == 'grains':
            cal, prot, fat, carb, fib, sug = 120, 4, 1, 25, 3, 1
        elif cat == 'proteins':
            cal, prot, fat, carb, fib, sug = 180, 25, 8, 0, 0, 0
        elif cat == 'dairy':
            cal, prot, fat, carb, fib, sug = 100, 8, 5, 12, 0, 10
        elif cat == 'nuts_seeds':
            cal, prot, fat, carb, fib, sug = 180, 6, 16, 6, 3, 1
        elif cat == 'legumes':
            cal, prot, fat, carb, fib, sug = 110, 8, 0.5, 20, 8, 2
        elif cat == 'beverages':
            cal, prot, fat, carb, fib, sug = 40, 0.5, 0, 10, 0, 9
        elif cat == 'oils':
            cal, prot, fat, carb, fib, sug = 120, 0, 14, 0, 0, 0
        else:  # snacks
            cal, prot, fat, carb, fib, sug = 150, 3, 8, 18, 1, 8
        
        # Add variance (±20% for realism)
        food = {
            'fdc_id': 100000 + i,
            'description': f'{cat.title()} Item {i % 30}',
            'food_category': cat,
            'calories': max(10, cal * np.random.uniform(0.8, 1.2)),
            'protein_g': max(0, prot * np.random.uniform(0.8, 1.2)),
            'fat_g': max(0, fat * np.random.uniform(0.8, 1.2)),
            'carbs_g': max(0, carb * np.random.uniform(0.8, 1.2)),
            'fiber_g': max(0, fib * np.random.uniform(0.8, 1.2)),
            'sugars_g': max(0, sug * np.random.uniform(0.8, 1.2)),
            'sodium_mg': np.random.uniform(0, 800),
            'vitamin_a_iu': np.random.uniform(0, 5000),
            'vitamin_c_mg': np.random.uniform(0, 50),
            'calcium_mg': np.random.uniform(0, 300),
            'iron_mg': np.random.uniform(0, 5),
            'potassium_mg': np.random.uniform(100, 800),
            'magnesium_mg': np.random.uniform(10, 100),
            'zinc_mg': np.random.uniform(0, 5),
            'phosphorus_mg': np.random.uniform(50, 300),
            'cost_per_serving': np.random.uniform(0.5, 5.0),
            # Binary flags for allergens/dietary
            'is_glutenfree': 1 if cat in ['vegetables', 'fruits', 'proteins', 'dairy'] else 0,
            'is_nutfree': 0 if cat == 'nuts_seeds' else 1,
            'is_vegan': 1 if cat in ['vegetables', 'fruits', 'grains', 'nuts_seeds', 'legumes'] else 0,
        }
        foods.append(food)
    
    df = pd.DataFrame(foods)
    
    # Save base USDA data
    csv_path = DATA_DIR / 'usda-foods.csv'
    df.to_csv(csv_path, index=False)
    print(f"[Preprocess] Saved {len(df)} foods to {csv_path}")
    
    return df

def generate_synthetic_augmentation(base_df, n_synthetic=500):
    """
    Generate synthetic training data by perturbing nutritional values
    
    Why: Augments limited real data (288 rows) to 788 total for robust training
    Ensures 60% positive class (imbalanced, realistic for nutrition datasets)
    
    Label Generation Logic:
    fit=1 if: protein > 10g AND sugars < 5g AND fiber > 3g AND cost < 2
    This simulates "healthy, budget-friendly, allergen-safe" matches
    """
    print(f"[Preprocess] Generating {n_synthetic} synthetic samples...")
    
    synthetic_rows = []
    target_fit_ratio = 0.64  # 64% positive class (imbalanced)
    n_fit = int(n_synthetic * target_fit_ratio)
    n_unfit = n_synthetic - n_fit
    
    # Generate positive samples (fit=1)
    for i in range(n_fit):
        base = base_df.sample(1).iloc[0].copy()
        row = {
            'fdc_id': 200000 + i,
            'description': f'Synthetic Healthy {i}',
            'food_category': base['food_category'],
            'calories': np.random.uniform(100, 300),
            'protein_g': np.random.uniform(12, 30),  # High protein
            'fat_g': np.random.uniform(2, 15),
            'carbs_g': np.random.uniform(10, 40),
            'fiber_g': np.random.uniform(4, 12),  # High fiber
            'sugars_g': np.random.uniform(0, 4),  # Low sugar
            'sodium_mg': np.random.uniform(50, 600),
            'vitamin_a_iu': np.random.uniform(500, 5000),
            'vitamin_c_mg': np.random.uniform(5, 50),
            'calcium_mg': np.random.uniform(50, 300),
            'iron_mg': np.random.uniform(1, 5),
            'potassium_mg': np.random.uniform(200, 800),
            'magnesium_mg': np.random.uniform(30, 100),
            'zinc_mg': np.random.uniform(1, 5),
            'phosphorus_mg': np.random.uniform(100, 300),
            'cost_per_serving': np.random.uniform(0.5, 1.8),  # Budget-friendly
            'is_glutenfree': int(np.random.random() > 0.3),
            'is_nutfree': int(np.random.random() > 0.2),
            'is_vegan': int(np.random.random() > 0.5),
        }
        synthetic_rows.append(row)
    
    # Generate negative samples (fit=0)
    for i in range(n_unfit):
        base = base_df.sample(1).iloc[0].copy()
        row = {
            'fdc_id': 300000 + i,
            'description': f'Synthetic Unhealthy {i}',
            'food_category': base['food_category'],
            'calories': np.random.uniform(200, 600),
            'protein_g': np.random.uniform(0, 8),  # Low protein
            'fat_g': np.random.uniform(10, 40),
            'carbs_g': np.random.uniform(30, 80),
            'fiber_g': np.random.uniform(0, 2),  # Low fiber
            'sugars_g': np.random.uniform(10, 40),  # High sugar
            'sodium_mg': np.random.uniform(400, 2000),
            'vitamin_a_iu': np.random.uniform(0, 1000),
            'vitamin_c_mg': np.random.uniform(0, 10),
            'calcium_mg': np.random.uniform(0, 100),
            'iron_mg': np.random.uniform(0, 2),
            'potassium_mg': np.random.uniform(50, 300),
            'magnesium_mg': np.random.uniform(5, 50),
            'zinc_mg': np.random.uniform(0, 2),
            'phosphorus_mg': np.random.uniform(30, 150),
            'cost_per_serving': np.random.uniform(2.5, 5.0),  # Expensive
            'is_glutenfree': int(np.random.random() > 0.7),
            'is_nutfree': int(np.random.random() > 0.6),
            'is_vegan': int(np.random.random() > 0.7),
        }
        synthetic_rows.append(row)
    
    synthetic_df = pd.DataFrame(synthetic_rows)
    print(f"[Preprocess] Generated {n_fit} fit + {n_unfit} unfit samples")
    
    return synthetic_df

def compute_labels(df):
    """
    Compute binary "fit" label based on nutritional criteria
    
    Label Logic (supervised learning target):
    fit = 1 if ALL conditions met:
      - protein_g > 10 (adequate protein for satiety/muscle)
      - sugars_g < 5 (low sugar for weight loss/diabetes)
      - fiber_g > 3 (digestive health, fullness)
      - cost_per_serving < 2 (budget-friendly)
    
    Why: Simulates multi-objective optimization (health + budget + allergen safety)
    Matches typical user goals from onboarding (weight loss, budget $50-100/week)
    """
    df['fit'] = (
        (df['protein_g'] > 10) &
        (df['sugars_g'] < 5) &
        (df['fiber_g'] > 3) &
        (df['cost_per_serving'] < 2)
    ).astype(int)
    
    print(f"[Preprocess] Label distribution: fit=1 ({df['fit'].sum()}, {df['fit'].mean()*100:.1f}%), fit=0 ({(1-df['fit']).sum()}, {(1-df['fit']).mean()*100:.1f}%)")
    
    return df

def compute_derived_features(df):
    """
    Engineer derived features for better predictive power
    
    Derived Features:
    1. nutrient_density = (protein_g + fiber_g) / calories
       Why: Measures nutrient quality per calorie (higher = healthier)
    2. sugar_to_carb_ratio = sugars_g / (carbs_g + 1)
       Why: High ratio indicates processed foods (simple carbs)
    
    Mathematical Justification:
    These ratios capture non-linear interactions between nutrients
    that single features miss (e.g., high fiber + low cal = filling)
    """
    df['nutrient_density'] = (df['protein_g'] + df['fiber_g']) / (df['calories'] + 1)
    df['sugar_to_carb_ratio'] = df['sugars_g'] / (df['carbs_g'] + 1)
    
    print(f"[Preprocess] Added derived features: nutrient_density, sugar_to_carb_ratio")
    
    return df

def preprocess_data():
    """
    Main preprocessing pipeline
    
    Steps:
    1. Load/create USDA data (288 rows)
    2. Augment with synthetics (500 rows) → 788 total
    3. Compute labels (fit=1/0)
    4. Handle missing values (median imputation for numerical)
    5. Encode categoricals (OneHot for food_category)
    6. Scale numericals (StandardScaler: mean=0, std=1)
    7. Feature selection (SelectKBest chi2: 25→10 features)
    8. Split 80/20 stratified (preserves class ratio)
    9. Apply SMOTE on training set only (balance to 50/50)
    10. Save preprocessor + data
    
    Output:
    - processed_data.csv (full dataset with labels)
    - train_data.csv, test_data.csv (stratified split)
    - preprocessor.pkl (fitted ColumnTransformer for predict.py)
    - feature_names.json (for interpretability)
    """
    print("\n" + "="*60)
    print("MEAL RECOMMENDATION ML PIPELINE - DATA PREPROCESSING")
    print("="*60 + "\n")
    
    # Step 1: Load or create USDA data
    usda_path = DATA_DIR / 'usda-foods.csv'
    if usda_path.exists():
        print(f"[Preprocess] Loading existing USDA data from {usda_path}")
        base_df = pd.read_csv(usda_path)
    else:
        base_df = create_sample_usda_data()
    
    # Step 2: Augment with synthetic data
    synthetic_df = generate_synthetic_augmentation(base_df, n_synthetic=500)
    df = pd.concat([base_df, synthetic_df], ignore_index=True)
    print(f"[Preprocess] Combined dataset: {len(df)} total rows")
    
    # Step 3: Compute labels
    df = compute_labels(df)
    
    # Step 4: Compute derived features
    df = compute_derived_features(df)
    
    # Step 5: Define feature columns
    numerical_features = [
        'calories', 'protein_g', 'fat_g', 'carbs_g', 'fiber_g', 'sugars_g',
        'sodium_mg', 'vitamin_a_iu', 'vitamin_c_mg', 'calcium_mg', 'iron_mg',
        'potassium_mg', 'magnesium_mg', 'zinc_mg', 'phosphorus_mg',
        'cost_per_serving', 'nutrient_density', 'sugar_to_carb_ratio'
    ]
    
    categorical_features = ['food_category']
    
    binary_features = ['is_glutenfree', 'is_nutfree', 'is_vegan']
    
    # Step 6: Handle missing values
    print("\n[Preprocess] Handling missing values...")
    for col in numerical_features:
        if df[col].isnull().sum() > 0:
            median_val = df[col].median()
            df[col].fillna(median_val, inplace=True)
            print(f"  - Imputed {col} with median {median_val:.2f}")
    
    for col in categorical_features:
        df[col].fillna('unknown', inplace=True)
    
    # Step 7: Prepare features and target
    X = df[numerical_features + categorical_features + binary_features]
    y = df['fit']
    
    # Step 8: Split dataset (80/20 stratified)
    # Why stratified: Preserves 64/36 class ratio in both train/test
    # Prevents biased evaluation on imbalanced nutrition labels
    print(f"\n[Preprocess] Splitting data 80/20 stratified (random_state={RANDOM_STATE})...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )
    
    print(f"  - Train: {len(X_train)} samples (fit={y_train.sum()}, {y_train.mean()*100:.1f}%)")
    print(f"  - Test: {len(X_test)} samples (fit={y_test.sum()}, {y_test.mean()*100:.1f}%)")
    
    # Step 9: Create preprocessing pipeline
    print("\n[Preprocess] Creating preprocessing pipeline...")
    
    # ColumnTransformer: Applies different transformations to different column types
    # - Numerical: SimpleImputer (median) → StandardScaler (mean=0, std=1)
    # - Categorical: OneHotEncoder (drop='first' avoids multicollinearity)
    # - Binary: passthrough (already 0/1)
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numerical_features),
            ('cat', OneHotEncoder(drop='first', handle_unknown='ignore'), categorical_features),
            ('bin', 'passthrough', binary_features)
        ],
        remainder='drop'
    )
    
    # Fit preprocessor on training data only (avoid data leakage)
    X_train_transformed = preprocessor.fit_transform(X_train)
    X_test_transformed = preprocessor.transform(X_test)
    
    # Get feature names after transformation
    num_names = numerical_features
    cat_names = preprocessor.named_transformers_['cat'].get_feature_names_out(categorical_features).tolist()
    bin_names = binary_features
    feature_names = num_names + cat_names + bin_names
    
    print(f"  - Features after transformation: {len(feature_names)}")
    print(f"  - Feature names: {feature_names[:10]}... (showing first 10)")
    
    # Step 10: Feature selection (SelectKBest with chi2)
    # Why: Reduces from 25+ to 10 features, removes noise, speeds training
    # chi2 score: Measures dependency between feature and target
    print("\n[Preprocess] Applying feature selection (SelectKBest chi2, k=10)...")
    
    # Note: chi2 requires non-negative features, so we shift if needed
    X_train_nonneg = X_train_transformed - X_train_transformed.min() + 1e-9
    X_test_nonneg = X_test_transformed - X_test_transformed.min() + 1e-9
    
    selector = SelectKBest(score_func=chi2, k=min(10, len(feature_names)))
    X_train_selected = selector.fit_transform(X_train_nonneg, y_train)
    X_test_selected = selector.transform(X_test_nonneg)
    
    # Get selected feature names
    selected_idx = selector.get_support(indices=True)
    selected_features = [feature_names[i] for i in selected_idx]
    chi2_scores = selector.scores_[selected_idx]
    
    print(f"  - Selected {X_train_selected.shape[1]} features:")
    for feat, score in zip(selected_features, chi2_scores):
        print(f"    • {feat}: chi2={score:.2f}")
    
    # Step 11: Apply SMOTE oversampling (training set only)
    # Why: Balances 64/36 to 50/50, prevents RF bias toward majority
    # Improves recall on minority class (unfit foods)
    print("\n[Preprocess] Applying SMOTE oversampling (training set only)...")
    print(f"  - Before SMOTE: fit=1 {y_train.sum()}, fit=0 {(1-y_train).sum()}")
    
    smote = SMOTE(random_state=RANDOM_STATE, k_neighbors=5)
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train_selected, y_train)
    
    print(f"  - After SMOTE: fit=1 {y_train_resampled.sum()}, fit=0 {(1-y_train_resampled).sum()}")
    print(f"  - Train size increased: {len(y_train)} → {len(y_train_resampled)}")
    
    # Step 12: Save everything
    print("\n[Preprocess] Saving preprocessed data and artifacts...")
    
    # Save full dataset with labels
    df.to_csv(ML_DIR / 'processed_data.csv', index=False)
    print(f"  - Saved processed_data.csv ({len(df)} rows)")
    
    # Save train/test splits (with selected features)
    train_df = pd.DataFrame(X_train_resampled, columns=selected_features)
    train_df['fit'] = y_train_resampled.values
    train_df.to_csv(ML_DIR / 'train_data.csv', index=False)
    print(f"  - Saved train_data.csv ({len(train_df)} rows)")
    
    test_df = pd.DataFrame(X_test_selected, columns=selected_features)
    test_df['fit'] = y_test.values
    test_df.to_csv(ML_DIR / 'test_data.csv', index=False)
    print(f"  - Saved test_data.csv ({len(test_df)} rows)")
    
    # Save preprocessor pipeline
    joblib.dump(preprocessor, ML_DIR / 'preprocessor.pkl')
    print(f"  - Saved preprocessor.pkl")
    
    # Save feature selector
    joblib.dump(selector, ML_DIR / 'feature_selector.pkl')
    print(f"  - Saved feature_selector.pkl")
    
    # Save feature names
    feature_info = {
        'all_features': feature_names,
        'selected_features': selected_features,
        'chi2_scores': chi2_scores.tolist()
    }
    with open(ML_DIR / 'feature_names.json', 'w') as f:
        json.dump(feature_info, f, indent=2)
    print(f"  - Saved feature_names.json")
    
    print("\n" + "="*60)
    print("PREPROCESSING COMPLETE!")
    print("="*60)
    print(f"Total samples: {len(df)}")
    print(f"Train samples: {len(train_df)} (after SMOTE)")
    print(f"Test samples: {len(test_df)}")
    print(f"Features: {len(selected_features)} (selected from {len(feature_names)})")
    print(f"Class distribution: {df['fit'].value_counts().to_dict()}")
    print("\nNext step: Run train.py for model training")
    print("="*60 + "\n")

if __name__ == '__main__':
    preprocess_data()
