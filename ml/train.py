"""
Comprehensive Machine Learning Pipeline for Insurance Fraud Detection.
Trains Random Forest, XGBoost, Logistic Regression, and Isolation Forest.
Evaluates metrics (Precision, Recall, F1, ROC-AUC, Confusion Matrix) and saves artifacts.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    roc_curve
)

from feature_engineering import encode_features

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATASET_PATH = os.path.join(BASE_DIR, "dataset", "synthetic_claims_12k.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)

def train_and_evaluate():
    print(f"Loading dataset from: {DATASET_PATH}")
    df = pd.read_csv(DATASET_PATH)
    print(f"Total dataset records: {len(df)}")
    
    # Target variable
    y = df["is_fraud"].values
    
    # Feature matrix
    X_raw = encode_features(df)
    feature_names = list(X_raw.columns)
    print(f"Generated {len(feature_names)} features: {feature_names[:8]}...")
    
    # Train / Test split (80/20 stratified)
    X_train_df, X_test_df, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.20, random_state=42, stratify=y
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train_df)
    X_test_scaled = scaler.transform(X_test_df)
    
    # 1. Isolation Forest for Unsupervised Anomaly Detection
    print("\n[1/4] Training Isolation Forest for Anomaly Detection...")
    iso_forest = IsolationForest(n_estimators=150, contamination=0.10, random_state=42, n_jobs=-1)
    iso_forest.fit(X_train_scaled)
    # Convert anomaly score to 0..1 scale (higher = more anomalous)
    iso_test_scores = -iso_forest.score_samples(X_test_scaled)
    iso_test_scores_norm = (iso_test_scores - iso_test_scores.min()) / (iso_test_scores.max() - iso_test_scores.min() + 1e-6)
    
    # 2. Logistic Regression Baseline
    print("[2/4] Training Logistic Regression...")
    lr_model = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=42)
    lr_model.fit(X_train_scaled, y_train)
    lr_probs = lr_model.predict_proba(X_test_scaled)[:, 1]
    lr_preds = (lr_probs >= 0.5).astype(int)
    
    # 3. Random Forest Classifier
    print("[3/4] Training Random Forest Classifier...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=12,
        class_weight="balanced_subsample",
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train_df, y_train)
    rf_probs = rf_model.predict_proba(X_test_df)[:, 1]
    rf_preds = (rf_probs >= 0.5).astype(int)
    
    # 4. XGBoost Classifier
    print("[4/4] Training XGBoost Classifier...")
    pos_weight = (len(y_train) - sum(y_train)) / max(sum(y_train), 1)
    xgb_model = XGBClassifier(
        n_estimators=250,
        max_depth=6,
        learning_rate=0.08,
        scale_pos_weight=pos_weight,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        eval_metric="logloss"
    )
    xgb_model.fit(X_train_df, y_train)
    xgb_probs = xgb_model.predict_proba(X_test_df)[:, 1]
    xgb_preds = (xgb_probs >= 0.5).astype(int)
    
    # Evaluation function
    def evaluate_model(name, y_true, y_pred, y_prob):
        acc = float(accuracy_score(y_true, y_pred))
        prec = float(precision_score(y_true, y_pred, zero_division=0))
        rec = float(recall_score(y_true, y_pred, zero_division=0))
        f1 = float(f1_score(y_true, y_pred, zero_division=0))
        auc = float(roc_auc_score(y_true, y_prob))
        cm = confusion_matrix(y_true, y_pred).tolist()
        
        # ROC curve sample (downsample to 40 points for smooth frontend rendering)
        fpr, tpr, _ = roc_curve(y_true, y_prob)
        step = max(1, len(fpr) // 35)
        roc_pts = [{"fpr": round(float(f), 4), "tpr": round(float(t), 4)} for f, t in zip(fpr[::step], tpr[::step])]
        if roc_pts[-1]["fpr"] < 1.0:
            roc_pts.append({"fpr": 1.0, "tpr": 1.0})
            
        return {
            "name": name,
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(auc, 4),
            "confusion_matrix": {
                "tn": cm[0][0],
                "fp": cm[0][1],
                "fn": cm[1][0],
                "tp": cm[1][1]
            },
            "roc_curve": roc_pts
        }
    
    lr_metrics = evaluate_model("Logistic Regression", y_test, lr_preds, lr_probs)
    rf_metrics = evaluate_model("Random Forest", y_test, rf_preds, rf_probs)
    xgb_metrics = evaluate_model("XGBoost", y_test, xgb_preds, xgb_probs)
    
    print("\n--- MODEL PERFORMANCE COMPARISON ---")
    print(f"Logistic Regression : AUC = {lr_metrics['roc_auc']}, F1 = {lr_metrics['f1_score']}, Precision = {lr_metrics['precision']}, Recall = {lr_metrics['recall']}")
    print(f"Random Forest       : AUC = {rf_metrics['roc_auc']}, F1 = {rf_metrics['f1_score']}, Precision = {rf_metrics['precision']}, Recall = {rf_metrics['recall']}")
    print(f"XGBoost             : AUC = {xgb_metrics['roc_auc']}, F1 = {xgb_metrics['f1_score']}, Precision = {xgb_metrics['precision']}, Recall = {xgb_metrics['recall']}")
    
    # Champion selection based on highest ROC-AUC and F1
    champion_name = "XGBoost" if xgb_metrics["roc_auc"] >= rf_metrics["roc_auc"] else "Random Forest"
    champion_model = xgb_model if champion_name == "XGBoost" else rf_model
    print(f"\n=> Champion Model Selected: {champion_name}")
    
    # Feature importances from XGBoost
    importances = xgb_model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    top_features = [
        {"feature": feature_names[i], "importance": round(float(importances[i]), 4)}
        for i in sorted_idx[:15]
    ]
    
    # Save Model Artifacts
    print("\nSaving model artifacts...")
    joblib.dump(champion_model, os.path.join(MODELS_DIR, "champion_model.joblib"))
    joblib.dump(xgb_model, os.path.join(MODELS_DIR, "xgboost_model.joblib"))
    joblib.dump(rf_model, os.path.join(MODELS_DIR, "rf_model.joblib"))
    joblib.dump(lr_model, os.path.join(MODELS_DIR, "lr_model.joblib"))
    joblib.dump(iso_forest, os.path.join(MODELS_DIR, "isolation_forest.joblib"))
    joblib.dump(scaler, os.path.join(MODELS_DIR, "scaler.joblib"))
    
    # Save Feature Names
    with open(os.path.join(MODELS_DIR, "feature_names.json"), "w") as f:
        json.dump(feature_names, f, indent=2)
        
    # Save Benchmark Metrics
    metrics_data = {
        "dataset_size": len(df),
        "test_size": len(y_test),
        "fraud_rate": round(float(np.mean(y)), 4),
        "champion": champion_name,
        "models": {
            "xgboost": xgb_metrics,
            "random_forest": rf_metrics,
            "logistic_regression": lr_metrics,
            "isolation_forest": {
                "name": "Isolation Forest (Anomaly Detection)",
                "description": "Unsupervised anomaly detector identifying outlier claims without label dependency",
                "contamination": 0.10,
                "n_estimators": 150
            }
        },
        "feature_importances": top_features,
        "version": "1.0.0",
        "last_trained": pd.Timestamp.now().isoformat()
    }
    
    with open(os.path.join(MODELS_DIR, "model_metrics.json"), "w") as f:
        json.dump(metrics_data, f, indent=2)
        
    print(f"Artifacts successfully stored in: {MODELS_DIR}")
    return metrics_data

if __name__ == "__main__":
    train_and_evaluate()
