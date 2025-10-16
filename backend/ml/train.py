"""
Random Forest Model Training for Meal Recommendation System
Author: NutriSolve ML Team
Date: October 2025

Theoretical Foundation:
Random Forest Classifier - Bagging ensemble of N decision trees
Mathematical Formulation:
- Each tree T_i builds via recursive splits minimizing Gini impurity:
  G(node_m) = 1 - Σ(k=1 to K) p_mk²
  where p_mk = proportion of class k in node m, K = number of classes
  
- Aggregate prediction for classification:
  P(y=1|x) = (1/N) Σ(i=1 to N) P_i(y=1|x)
  where P_i is the prediction from tree T_i's leaf node
  
- Final classification: majority vote across all trees
  ŷ = argmax_k Σ(i=1 to N) I(T_i(x) = k)

Why Random Forest:
1. Handles non-linear relationships (nutrition data: fiber-calorie interactions)
2. Robust to outliers and noise (variable vitamin levels across foods)
3. Bagging reduces variance: σ_ensemble ≈ σ_tree / √N
4. Feature importance via Gini decrease (interpretability)
5. No hyperparameter sensitivity (vs SVM kernel tuning)
6. Naturally handles imbalanced data with class_weight='balanced'

Hyperparameter Tuning:
GridSearchCV with 5-fold cross-validation on training set
Scoring: f1_macro (balances precision and recall on imbalanced classes)
Search space: n_estimators [50,100,200], max_depth [5,10,15], min_samples_split [2,5,10]
"""

import pandas as pd
import numpy as np
import joblib
import json
from pathlib import Path
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GridSearchCV, cross_val_score
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    classification_report, confusion_matrix, roc_auc_score
)
import warnings
warnings.filterwarnings('ignore')

# Set random seed for reproducibility
RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)

# Define paths
BASE_DIR = Path(__file__).parent.parent
ML_DIR = BASE_DIR / 'ml'

def load_training_data():
    """
    Load preprocessed training and test data
    Returns: X_train, y_train, X_test, y_test, feature_names
    """
    print("[Train] Loading preprocessed data...")
    
    train_df = pd.read_csv(ML_DIR / 'train_data.csv')
    test_df = pd.read_csv(ML_DIR / 'test_data.csv')
    
    # Load feature names
    with open(ML_DIR / 'feature_names.json', 'r') as f:
        feature_info = json.load(f)
    
    feature_names = feature_info['selected_features']
    
    # Separate features and target
    X_train = train_df[feature_names].values
    y_train = train_df['fit'].values
    X_test = test_df[feature_names].values
    y_test = test_df['fit'].values
    
    print(f"  - Train: {X_train.shape[0]} samples × {X_train.shape[1]} features")
    print(f"  - Test: {X_test.shape[0]} samples × {X_test.shape[1]} features")
    print(f"  - Train class distribution: fit=1 ({y_train.sum()}, {y_train.mean()*100:.1f}%)")
    print(f"  - Test class distribution: fit=1 ({y_test.sum()}, {y_test.mean()*100:.1f}%)")
    
    return X_train, y_train, X_test, y_test, feature_names

def perform_hyperparameter_tuning(X_train, y_train):
    """
    Hyperparameter tuning via GridSearchCV
    
    Search Strategy:
    - Exhaustive grid search (small parameter space)
    - 5-fold cross-validation (balances bias-variance)
    - Scoring: f1_macro (harmonic mean of precision/recall per class, then averaged)
      Why: Handles imbalanced classes better than accuracy
      Formula: F1_macro = (1/K) Σ(k=1 to K) 2·(precision_k · recall_k)/(precision_k + recall_k)
    
    Parameter Grid:
    - n_estimators: Number of trees [50, 100, 200]
      More trees → lower variance, but diminishing returns >100
    - max_depth: Max tree depth [5, 10, 15]
      Deeper → more complex splits, but risk overfitting
    - min_samples_split: Min samples to split node [2, 5, 10]
      Higher → more conservative splits, prevents overfitting
    
    Why GridSearch over RandomSearch:
    Small parameter space (3×3×3=27 combinations) allows exhaustive search
    Ensures global optimum within grid (no stochastic sampling bias)
    """
    print("\n[Train] Starting hyperparameter tuning...")
    print("  - Method: GridSearchCV")
    print("  - Cross-validation: 5-fold")
    print("  - Scoring: f1_macro (balanced for imbalanced classes)")
    
    # Define parameter grid
    param_grid = {
        'n_estimators': [50, 100, 200],        # Number of trees
        'max_depth': [5, 10, 15],               # Tree depth
        'min_samples_split': [2, 5, 10],        # Min samples to split
        'class_weight': ['balanced'],           # Handle imbalance
        'random_state': [RANDOM_STATE]          # Reproducibility
    }
    
    print(f"  - Parameter grid: {len(param_grid['n_estimators']) * len(param_grid['max_depth']) * len(param_grid['min_samples_split'])} combinations")
    
    # Initialize base model
    rf_base = RandomForestClassifier(random_state=RANDOM_STATE)
    
    # GridSearchCV: Exhaustive search with cross-validation
    grid_search = GridSearchCV(
        estimator=rf_base,
        param_grid=param_grid,
        cv=5,                      # 5-fold cross-validation
        scoring='f1_macro',        # Evaluation metric
        n_jobs=-1,                 # Use all CPU cores
        verbose=1,                 # Progress updates
        return_train_score=True    # Track train scores for overfitting detection
    )
    
    # Fit grid search
    print("\n[Train] Fitting GridSearchCV (this may take a few minutes)...")
    grid_search.fit(X_train, y_train)
    
    # Extract best parameters and scores
    best_params = grid_search.best_params_
    best_score = grid_search.best_score_
    
    print("\n[Train] Hyperparameter tuning complete!")
    print(f"  - Best cross-val f1_macro: {best_score:.4f}")
    print(f"  - Best parameters:")
    for param, value in best_params.items():
        if param != 'random_state':
            print(f"    • {param}: {value}")
    
    # Get best model
    best_model = grid_search.best_estimator_
    
    # Display top 5 configurations
    print("\n[Train] Top 5 configurations by f1_macro:")
    results_df = pd.DataFrame(grid_search.cv_results_)
    top_5 = results_df.nlargest(5, 'mean_test_score')[
        ['param_n_estimators', 'param_max_depth', 'param_min_samples_split', 
         'mean_test_score', 'std_test_score']
    ]
    print(top_5.to_string(index=False))
    
    return best_model, best_params

def evaluate_model(model, X_train, y_train, X_test, y_test, feature_names):
    """
    Comprehensive model evaluation on training and test sets
    
    Metrics:
    1. Accuracy: (TP + TN) / Total
    2. Precision: TP / (TP + FP) - "How many predicted positives are correct?"
    3. Recall: TP / (TP + FN) - "How many actual positives did we find?"
    4. F1-score: 2 · (Precision · Recall) / (Precision + Recall) - Harmonic mean
    5. ROC-AUC: Area under Receiver Operating Characteristic curve
    6. Confusion Matrix: Visualize TP, TN, FP, FN
    
    Why these metrics:
    - Accuracy insufficient for imbalanced data (can be high by predicting majority)
    - F1 balances precision/recall (critical for both false positives and false negatives)
    - ROC-AUC measures ranking quality (important for top-k recommendations)
    """
    print("\n[Train] Evaluating model performance...")
    
    # Predictions
    y_train_pred = model.predict(X_train)
    y_test_pred = model.predict(X_test)
    
    # Probabilities for ROC-AUC
    y_train_proba = model.predict_proba(X_train)[:, 1]
    y_test_proba = model.predict_proba(X_test)[:, 1]
    
    # Training set metrics
    train_acc = accuracy_score(y_train, y_train_pred)
    train_f1 = f1_score(y_train, y_train_pred, average='macro')
    train_precision = precision_score(y_train, y_train_pred, average='macro')
    train_recall = recall_score(y_train, y_train_pred, average='macro')
    train_auc = roc_auc_score(y_train, y_train_proba)
    
    # Test set metrics
    test_acc = accuracy_score(y_test, y_test_pred)
    test_f1 = f1_score(y_test, y_test_pred, average='macro')
    test_precision = precision_score(y_test, y_test_pred, average='macro')
    test_recall = recall_score(y_test, y_test_pred, average='macro')
    test_auc = roc_auc_score(y_test, y_test_proba)
    
    # Print summary table
    print("\n" + "="*70)
    print("MODEL PERFORMANCE SUMMARY")
    print("="*70)
    print(f"{'Metric':<20} {'Training':<20} {'Test':<20} {'Difference':<10}")
    print("-"*70)
    print(f"{'Accuracy':<20} {train_acc:>19.4f} {test_acc:>19.4f} {abs(train_acc-test_acc):>9.4f}")
    print(f"{'F1-score (macro)':<20} {train_f1:>19.4f} {test_f1:>19.4f} {abs(train_f1-test_f1):>9.4f}")
    print(f"{'Precision (macro)':<20} {train_precision:>19.4f} {test_precision:>19.4f} {abs(train_precision-test_precision):>9.4f}")
    print(f"{'Recall (macro)':<20} {train_recall:>19.4f} {test_recall:>19.4f} {abs(train_recall-test_recall):>9.4f}")
    print(f"{'ROC-AUC':<20} {train_auc:>19.4f} {test_auc:>19.4f} {abs(train_auc-test_auc):>9.4f}")
    print("="*70)
    
    # Check for overfitting
    if train_f1 - test_f1 > 0.10:
        print("\n⚠️  WARNING: Potential overfitting detected (train-test F1 gap > 0.10)")
    else:
        print("\n✓ Good generalization (train-test F1 gap < 0.10)")
    
    # Detailed classification report (per-class metrics)
    print("\n[Train] Classification Report (Test Set):")
    print(classification_report(y_test, y_test_pred, 
                                target_names=['Unfit (0)', 'Fit (1)'],
                                digits=4))
    
    # Confusion matrix
    print("[Train] Confusion Matrix (Test Set):")
    cm = confusion_matrix(y_test, y_test_pred)
    print(f"                Predicted Unfit  Predicted Fit")
    print(f"Actual Unfit    {cm[0,0]:>15}  {cm[0,1]:>13}")
    print(f"Actual Fit      {cm[1,0]:>15}  {cm[1,1]:>13}")
    
    # Feature importances (top 10)
    print("\n[Train] Top 10 Feature Importances (Gini decrease):")
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1][:10]
    
    print(f"{'Rank':<6} {'Feature':<30} {'Importance':<12} {'Percentage'}")
    print("-"*70)
    for rank, idx in enumerate(indices, 1):
        feat_name = feature_names[idx] if idx < len(feature_names) else f"Feature_{idx}"
        importance = importances[idx]
        percentage = importance * 100
        print(f"{rank:<6} {feat_name:<30} {importance:>11.6f} {percentage:>10.2f}%")
    
    # Return metrics dictionary
    metrics = {
        'train': {
            'accuracy': float(train_acc),
            'f1_macro': float(train_f1),
            'precision_macro': float(train_precision),
            'recall_macro': float(train_recall),
            'roc_auc': float(train_auc)
        },
        'test': {
            'accuracy': float(test_acc),
            'f1_macro': float(test_f1),
            'precision_macro': float(test_precision),
            'recall_macro': float(test_recall),
            'roc_auc': float(test_auc)
        },
        'confusion_matrix': cm.tolist(),
        'feature_importances': {
            feature_names[i] if i < len(feature_names) else f"Feature_{i}": float(importances[i])
            for i in range(len(importances))
        }
    }
    
    return metrics

def train_model():
    """
    Main training pipeline
    
    Steps:
    1. Load preprocessed training and test data
    2. Perform hyperparameter tuning via GridSearchCV
    3. Train final model with best parameters
    4. Evaluate on train and test sets
    5. Save trained model and metrics
    
    Output:
    - rf_model.pkl: Trained Random Forest model (for predict.py)
    - training_metrics.json: Performance metrics (for documentation)
    """
    print("\n" + "="*70)
    print("MEAL RECOMMENDATION ML PIPELINE - MODEL TRAINING")
    print("="*70 + "\n")
    
    # Step 1: Load data
    X_train, y_train, X_test, y_test, feature_names = load_training_data()
    
    # Step 2: Hyperparameter tuning
    best_model, best_params = perform_hyperparameter_tuning(X_train, y_train)
    
    # Step 3: Evaluate model
    metrics = evaluate_model(best_model, X_train, y_train, X_test, y_test, feature_names)
    
    # Step 4: Save model
    print("\n[Train] Saving trained model...")
    model_path = ML_DIR / 'rf_model.pkl'
    joblib.dump(best_model, model_path)
    print(f"  - Saved model to {model_path}")
    
    # Step 5: Save metrics
    metrics_path = ML_DIR / 'training_metrics.json'
    training_info = {
        'model': 'RandomForestClassifier',
        'best_params': best_params,
        'metrics': metrics,
        'feature_names': feature_names,
        'training_date': pd.Timestamp.now().isoformat()
    }
    
    with open(metrics_path, 'w') as f:
        json.dump(training_info, f, indent=2)
    print(f"  - Saved metrics to {metrics_path}")
    
    # Final summary
    print("\n" + "="*70)
    print("TRAINING COMPLETE!")
    print("="*70)
    print(f"Model: Random Forest Classifier")
    print(f"Best parameters: n_estimators={best_params['n_estimators']}, "
          f"max_depth={best_params['max_depth']}, "
          f"min_samples_split={best_params['min_samples_split']}")
    print(f"Test F1-score (macro): {metrics['test']['f1_macro']:.4f}")
    print(f"Test ROC-AUC: {metrics['test']['roc_auc']:.4f}")
    
    # Check if meets target (F1 > 0.80)
    if metrics['test']['f1_macro'] >= 0.80:
        print("\n✓ Model meets target performance (F1 > 0.80)")
    else:
        print(f"\n⚠️  Model below target (F1 = {metrics['test']['f1_macro']:.4f} < 0.80)")
        print("   Consider: More data, feature engineering, or ensemble methods")
    
    print("\nNext step: Run predict.py to test predictions")
    print("="*70 + "\n")

if __name__ == '__main__':
    train_model()
