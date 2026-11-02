import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from ..config import settings

# Include ml path in sys.path
ML_DIR = os.path.join(settings.BASE_DIR, "ml")
if ML_DIR not in sys.path:
    sys.path.append(ML_DIR)

from feature_engineering import encode_features
from explainability import FraudExplainer

class MLService:
    def __init__(self):
        self.champion_model = None
        self.isolation_forest = None
        self.scaler = None
        self.feature_names = []
        self.explainer = None
        self.metrics_cache = None
        self._load_artifacts()

    def _load_artifacts(self):
        models_dir = settings.MODELS_DIR
        champion_path = os.path.join(models_dir, "champion_model.joblib")
        iso_path = os.path.join(models_dir, "isolation_forest.joblib")
        scaler_path = os.path.join(models_dir, "scaler.joblib")
        feat_path = os.path.join(models_dir, "feature_names.json")
        metrics_path = os.path.join(models_dir, "model_metrics.json")

        if os.path.exists(champion_path):
            try:
                self.champion_model = joblib.load(champion_path)
            except Exception as e:
                print(f"Error loading champion model: {e}")

        if os.path.exists(iso_path):
            try:
                self.isolation_forest = joblib.load(iso_path)
            except Exception as e:
                print(f"Error loading isolation forest: {e}")

        if os.path.exists(scaler_path):
            try:
                self.scaler = joblib.load(scaler_path)
            except Exception as e:
                print(f"Error loading scaler: {e}")

        if os.path.exists(feat_path):
            with open(feat_path, "r") as f:
                self.feature_names = json.load(f)

        if os.path.exists(metrics_path):
            with open(metrics_path, "r") as f:
                self.metrics_cache = json.load(f)

        # Initialize SHAP explainer
        self.explainer = FraudExplainer()

    def predict_claim(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs ML prediction and SHAP explanation for an insurance claim.
        Returns risk score (0-100), category, anomaly score, SHAP details, and explanation.
        """
        if self.champion_model is None:
            self._load_artifacts()

        # Build single row dataframe
        df_claim = pd.DataFrame([claim_data])
        features_df = encode_features(df_claim)
        
        # Align columns
        for col in self.feature_names:
            if col not in features_df.columns:
                features_df[col] = 0.0
        features_df = features_df[self.feature_names]

        # 1. Supervised Fraud Risk Probability (XGBoost)
        xgb_prob = 0.15 # fallback
        if self.champion_model is not None:
            try:
                probs = self.champion_model.predict_proba(features_df)
                xgb_prob = float(probs[0][1])
            except Exception as e:
                print(f"Prediction error: {e}")

        # 2. Unsupervised Anomaly Detection Score (Isolation Forest)
        anomaly_score = 0.10
        if self.isolation_forest is not None and self.scaler is not None:
            try:
                scaled_feats = self.scaler.transform(features_df)
                raw_anomaly = -float(self.isolation_forest.score_samples(scaled_feats)[0])
                anomaly_score = round(float(np.clip((raw_anomaly - 0.4) * 2.0, 0.0, 1.0)), 3)
            except Exception as e:
                print(f"Anomaly score error: {e}")

        # 3. Weighted Ensemble Risk Score (0 - 100)
        # Supervised probability accounts for 85%, anomaly score accounts for 15%
        blended_risk = (xgb_prob * 0.85) + (anomaly_score * 0.15)
        risk_score = int(round(blended_risk * 100))
        risk_score = max(1, min(99, risk_score))

        # Categorize
        if risk_score >= 70:
            risk_category = "High"
        elif risk_score >= 31:
            risk_category = "Medium"
        else:
            risk_category = "Low"

        # 4. Explainable AI (SHAP & contextual reasoning)
        shap_explanation = self.explainer.explain_instance(features_df, claim_data)

        return {
            "risk_score": risk_score,
            "risk_category": risk_category,
            "anomaly_score": anomaly_score,
            "model_name": "XGBoost Champion + Isolation Forest Anomaly Ensemble",
            "model_version": "1.0.0",
            "top_risk_indicators": shap_explanation["risk_indicators"],
            "shap_contributions": shap_explanation["top_risk_contributors"] + shap_explanation["top_protective_factors"],
            "all_shap_contributions": shap_explanation["all_shap_contributions"],
            "investigation_checklist": shap_explanation["investigation_checklist"],
            "natural_language_explanation": shap_explanation["natural_language_explanation"]
        }

    def get_benchmark_metrics(self) -> Dict[str, Any]:
        """Returns model performance metrics and confusion matrices."""
        if self.metrics_cache is None:
            metrics_path = os.path.join(settings.MODELS_DIR, "model_metrics.json")
            if os.path.exists(metrics_path):
                with open(metrics_path, "r") as f:
                    self.metrics_cache = json.load(f)
            else:
                return {}
        return self.metrics_cache

ml_service = MLService()
