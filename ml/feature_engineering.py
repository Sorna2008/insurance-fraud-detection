"""
Feature engineering and transformation pipeline for Insurance Fraud Detection.
Prepares raw claim records for training and real-time inference.
"""

import numpy as np
import pandas as pd
from typing import Tuple, List, Dict, Any

NUMERICAL_COLS = [
    "customer_age",
    "annual_income",
    "credit_score",
    "coverage_limit",
    "deductible",
    "premium_amount",
    "claim_amount",
    "policy_age_days",
    "submission_delay_days",
    "claim_to_coverage_ratio",
    "claim_to_income_ratio",
    "number_of_previous_claims",
    "previous_claim_payouts",
    "supporting_documents_count",
    "incident_weekend",
    "incident_hour",
]

CATEGORICAL_COLS = [
    "insurance_type",
    "region",
    "damage_severity",
    "police_report_filed",
    "witness_present",
]

# Known categories for stable one-hot encoding alignment
CATEGORICAL_LEVELS = {
    "insurance_type": ["Auto", "Property", "Health", "Life"],
    "region": ["Northeast", "Midwest", "South", "West"],
    "damage_severity": ["Minor", "Moderate", "Major", "Total Loss"],
    "police_report_filed": ["No", "Yes"],
    "witness_present": ["No", "Yes"],
}

def derive_computed_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes derived risk features from raw fields if not already present."""
    df_out = df.copy()
    
    # Dates handling
    if "policy_age_days" not in df_out.columns:
        if "policy_start_date" in df_out.columns and "incident_date" in df_out.columns:
            pol_start = pd.to_datetime(df_out["policy_start_date"])
            inc_date = pd.to_datetime(df_out["incident_date"])
            df_out["policy_age_days"] = (inc_date - pol_start).dt.days.clip(lower=0)
        else:
            df_out["policy_age_days"] = 180

    if "submission_delay_days" not in df_out.columns:
        if "claim_submission_date" in df_out.columns and "incident_date" in df_out.columns:
            sub_date = pd.to_datetime(df_out["claim_submission_date"])
            inc_date = pd.to_datetime(df_out["incident_date"])
            df_out["submission_delay_days"] = (sub_date - inc_date).dt.days.clip(lower=0)
        else:
            df_out["submission_delay_days"] = 5

    # Ratios
    if "claim_to_coverage_ratio" not in df_out.columns:
        cov = df_out.get("coverage_limit", 50000).replace(0, 50000)
        df_out["claim_to_coverage_ratio"] = (df_out["claim_amount"] / cov).round(4)

    if "claim_to_income_ratio" not in df_out.columns:
        inc = df_out.get("annual_income", 60000).replace(0, 60000)
        df_out["claim_to_income_ratio"] = (df_out["claim_amount"] / inc).round(4)

    if "incident_weekend" not in df_out.columns:
        if "incident_date" in df_out.columns:
            inc_date = pd.to_datetime(df_out["incident_date"])
            df_out["incident_weekend"] = inc_date.dt.weekday.isin([5, 6]).astype(int)
        else:
            df_out["incident_weekend"] = 0

    if "incident_hour" not in df_out.columns:
        df_out["incident_hour"] = 14

    if "supporting_documents_count" not in df_out.columns:
        if "supporting_documents" in df_out.columns:
            df_out["supporting_documents_count"] = df_out["supporting_documents"].apply(
                lambda x: len(str(x).split(";")) if pd.notna(x) and str(x).strip() else 0
            )
        else:
            df_out["supporting_documents_count"] = 2

    return df_out

def encode_features(df: pd.DataFrame) -> pd.DataFrame:
    """Transforms raw numerical and categorical variables into ML feature matrix."""
    df_derived = derive_computed_features(df)
    
    # Process numeric columns with imputation
    num_df = df_derived[NUMERICAL_COLS].copy()
    for col in NUMERICAL_COLS:
        num_df[col] = pd.to_numeric(num_df[col], errors="coerce").fillna(0)
    
    # Process categorical columns using predetermined dummies
    cat_frames = []
    for col, levels in CATEGORICAL_LEVELS.items():
        if col in df_derived.columns:
            col_series = df_derived[col].astype(str)
        else:
            col_series = pd.Series([levels[0]] * len(df_derived))
        
        # Create columns for each level except the first (drop_first=False for SHAP clarity)
        for lvl in levels:
            col_name = f"{col}_{lvl}"
            cat_frames.append(pd.Series((col_series == lvl).astype(float), name=col_name))
            
    cat_df = pd.concat(cat_frames, axis=1)
    
    features_df = pd.concat([num_df, cat_df], axis=1)
    return features_df
