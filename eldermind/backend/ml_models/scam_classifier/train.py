"""
ElderMind — Scam Classifier Training Script
Owner: Sudharsan (Cybersecurity Engineer)

Train a TF-IDF + Logistic Regression classifier on labeled examples.
Target accuracy: 88%+

Usage:
  cd backend
  python ml_models/scam_classifier/train.py

Output:
  ml_models/scam_classifier/model/tfidf.joblib
  ml_models/scam_classifier/model/logreg.joblib

Data:
  ml_models/scam_classifier/data/scam_examples.csv
  Columns: text, label  (label: 1=scam, 0=safe)

TODO (Sudharsan Week 5):
  - Collect and label at least 300 examples in scam_examples.csv
  - Run this script
  - Verify accuracy >= 88% on the held-out test set
  - Load the saved models in scam_middleware.py
"""

import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pandas as pd # type: ignore
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import joblib

DATA_PATH  = os.path.join(os.path.dirname(__file__), "data/scam_examples.csv")
MODEL_DIR  = os.path.join(os.path.dirname(__file__), "model")
os.makedirs(MODEL_DIR, exist_ok=True)

def train():
    print("Loading data...")
    df = pd.read_csv(DATA_PATH)
    print(f"  {len(df)} examples loaded. Label distribution:")
    print(f"  {df['label'].value_counts().to_dict()}")

    X = df["text"].astype(str)
    y = df["label"].astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\nFitting TF-IDF vectoriser...")
    vectoriser = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=5000,
        min_df=2,
        strip_accents="unicode",
    )
    X_train_vec = vectoriser.fit_transform(X_train)
    X_test_vec  = vectoriser.transform(X_test)

    print("Training Logistic Regression classifier...")
    clf = LogisticRegression(C=1.0, max_iter=1000, class_weight="balanced")
    clf.fit(X_train_vec, y_train)

    y_pred = clf.predict(X_test_vec)
    acc    = accuracy_score(y_test, y_pred)

    print(f"\n── TEST RESULTS ─────────────────────────────────")
    print(f"Accuracy: {acc:.2%}  (target: ≥ 88%)")
    print(classification_report(y_test, y_pred, target_names=["safe", "scam"]))

    if acc < 0.88:
        print("⚠️  Accuracy below 88% — add more training examples before deploying.")
    else:
        print("✅  Accuracy target met!")

    tfidf_path = os.path.join(MODEL_DIR, "tfidf.joblib")
    clf_path   = os.path.join(MODEL_DIR, "logreg.joblib")
    joblib.dump(vectoriser, tfidf_path)
    joblib.dump(clf,        clf_path)
    print(f"\nModels saved to {MODEL_DIR}/")
    print("Remember: model files are gitignored — share via Google Drive.")

if __name__ == "__main__":
    train()
