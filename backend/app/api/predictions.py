from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any

from ..database import get_db
from ..models import User, InsuranceClaim
from ..services.auth_service import get_current_user
from ..services.ml_service import ml_service
from ..services.claim_service import get_claim_detail_by_id

router = APIRouter(prefix="/predictions", tags=["ML Predictions & Explainable AI"])

@router.post("/evaluate")
def evaluate_claim_simulation(
    claim_data: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    On-the-fly ML fraud risk scoring and SHAP feature attribution for
    what-if simulations and interactive claim risk exploration.
    """
    prediction_result = ml_service.predict_claim(claim_data)
    return prediction_result

@router.get("/{claim_id}/explain")
def get_claim_explanation(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetches detailed SHAP explainability and risk checklist for an existing claim."""
    claim = db.query(InsuranceClaim).filter(InsuranceClaim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    claim_data = {
        "customer_age": claim.customer_age,
        "annual_income": 65000,
        "credit_score": 670,
        "coverage_limit": claim.claim_amount * 1.5,
        "deductible": 1000,
        "premium_amount": 1600,
        "claim_amount": claim.claim_amount,
        "policy_start_date": claim.policy_start_date,
        "incident_date": claim.incident_date,
        "claim_submission_date": claim.claim_submission_date,
        "insurance_type": claim.insurance_type,
        "region": claim.region,
        "damage_severity": claim.damage_severity,
        "police_report_filed": claim.police_report_filed,
        "witness_present": claim.witness_present,
        "number_of_previous_claims": claim.number_of_previous_claims,
        "previous_claim_payouts": claim.previous_claim_payouts,
        "supporting_documents_count": len(claim.supporting_documents.split(";")) if claim.supporting_documents else 0
    }
    explanation = ml_service.predict_claim(claim_data)
    return explanation

@router.get("/metrics/benchmarks")
def get_model_benchmarks(current_user: User = Depends(get_current_user)):
    """Returns model performance metrics (ROC-AUC, Precision, Recall, F1, Confusion Matrix)."""
    return ml_service.get_benchmark_metrics()
