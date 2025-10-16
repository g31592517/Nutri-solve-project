# ⚠️ Python Setup Required for ML Features

## Before Using ML Recommendations

The ML pipeline requires Python 3.8+ and several scientific computing libraries.

### Quick Install

```bash
# Install all ML dependencies at once
pip install pandas numpy scikit-learn imbalanced-learn joblib

# Or use requirements file
pip install -r backend/ml/requirements.txt
```

### Verify Installation

```bash
python3 -c "import pandas, sklearn, numpy, joblib; from imblearn.over_sampling import SMOTE; print('✓ All ML dependencies ready!')"
```

### If You Get Errors

**Linux/Ubuntu:**
```bash
sudo apt-get update
sudo apt-get install python3-pip
pip3 install pandas numpy scikit-learn imbalanced-learn joblib
```

**macOS:**
```bash
brew install python3
pip3 install pandas numpy scikit-learn imbalanced-learn joblib
```

**Windows:**
```bash
# Use Python 3.8+ from python.org
python -m pip install pandas numpy scikit-learn imbalanced-learn joblib
```

### Then Run ML Pipeline

```bash
python3 backend/ml/preprocess.py
python3 backend/ml/train.py
```

See `ML_QUICK_SETUP.md` for complete instructions.

---

**Note:** ML features are optional. The app works without them, but recommendations won't be personalized.
