import os
import json
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from ..config import settings
from ..models import (
    User, Customer, InsurancePolicy, InsuranceClaim,
    FraudPrediction, Investigation, InvestigationNote, AuditLog
)
from ..schemas import ClaimCreate, ClaimUpdate
from .ml_service import ml_service
from .auth_service import hash_password
from .audit_service import log_audit_event

def seed_initial_data_if_needed(db: Session):
    """Seeds initial demonstration data and default role users if database is empty."""
    # 1. Seed Default Users
    user_count = db.query(User).count()
    if user_count == 0:
        demo_users = [
            User(
                username="admin",
                email="admin@insureguard.ai",
                hashed_password=hash_password("admin123"),
                full_name="Sarah Jenkins (Chief Risk Officer)",
                role="Admin",
                is_active=True
            ),
            User(
                username="investigator",
                email="investigator@insureguard.ai",
                hashed_password="investigator123" if False else hash_password("investigator123"),
                full_name="David Miller (Senior SIU Investigator)",
                role="Fraud Investigator",
                is_active=True
            ),
            User(
                username="claimsofficer",
                email="officer@insureguard.ai",
                hashed_password=hash_password("officer123"),
                full_name="Elena Rostova (Claims Intake Specialist)",
                role="Claims Officer",
                is_active=True
            )
        ]
        db.add_all(demo_users)
        db.commit()
        print("Default demonstration users seeded.")

    # 2. Seed Initial Claims & Investigations
    claim_count = db.query(InsuranceClaim).count()
    if claim_count == 0:
        csv_path = os.path.join(settings.DATASET_DIR, "synthetic_claims_12k.csv")
        if os.path.exists(csv_path):
            print("Seeding initial database claims from synthetic dataset...")
            df = pd.read_csv(csv_path).head(600) # Load 600 rich sample claims
            
            investigator_user = db.query(User).filter(User.role == "Fraud Investigator").first()
            inv_name = investigator_user.full_name if investigator_user else "David Miller"
            inv_id = investigator_user.id if investigator_user else 2

            for _, row in df.iterrows():
                claim = InsuranceClaim(
                    claim_id=row["claim_id"],
                    customer_id=row["customer_id"],
                    customer_name=row["customer_name"],
                    policy_number=row["policy_number"],
                    customer_age=int(row["customer_age"]),
                    insurance_type=row["insurance_type"],
                    claim_amount=float(row["claim_amount"]),
                    policy_start_date=str(row["policy_start_date"]),
                    incident_date=str(row["incident_date"]),
                    claim_submission_date=str(row["claim_submission_date"]),
                    incident_location=str(row["incident_location"]),
                    region=str(row["region"]),
                    incident_type=str(row["incident_type"]),
                    damage_severity=str(row["damage_severity"]),
                    police_report_filed=str(row["police_report_filed"]),
                    witness_present=str(row["witness_present"]),
                    number_of_previous_claims=int(row["number_of_previous_claims"]),
                    previous_claim_payouts=float(row["previous_claim_payouts"]),
                    incident_description=str(row["incident_description"]),
                    supporting_documents=str(row["supporting_documents"]) if pd.notna(row["supporting_documents"]) else "",
                    status="Closed" if row["investigation_status"] in ["Verified Legitimate", "Confirmed Fraud"] else "Under Review"
                )
                db.add(claim)

                # Prediction record
                indicators_list = [i.strip() for i in str(row["fraud_indicators"]).split(";") if i.strip()]
                prediction = FraudPrediction(
                    claim_id=row["claim_id"],
                    risk_score=int(row["fraud_risk_score"]),
                    risk_category=str(row["fraud_risk_category"]),
                    anomaly_score=round(float(row["fraud_risk_score"] / 100 * 0.8), 3),
                    model_name="XGBoost Champion + Isolation Forest Anomaly Ensemble",
                    model_version="1.0.0",
                    top_risk_indicators=json.dumps(indicators_list),
                    shap_values_json=json.dumps([]),
                    checklist_json=json.dumps([
                        "Verify historical claim records in industry database.",
                        "Authenticate vendor repair invoices and estimate validity."
                    ]),
                    explanation_text=(
                        f"Claim evaluated with risk score of {row['fraud_risk_score']}/100. "
                        f"Categorized as {row['fraud_risk_category']} fraud risk. "
                        f"Primary factors: {', '.join(indicators_list[:2]) if indicators_list else 'Standard risk profile'}."
                    )
                )
                db.add(prediction)

                # Investigation record
                inv_status = str(row["investigation_status"])
                priority = "Critical" if row["fraud_risk_score"] >= 85 else ("High" if row["fraud_risk_category"] == "High" else "Medium")
                investigation = Investigation(
                    claim_id=row["claim_id"],
                    assigned_to_id=inv_id if inv_status != "Pending Review" else None,
                    assigned_to_name=inv_name if inv_status != "Pending Review" else None,
                    status=inv_status,
                    priority=priority,
                    outcome_reason=(
                        "Confirmed fraudulent activity detected during investigative review."
                        if inv_status == "Confirmed Fraud"
                        else ("Claim corroborated with valid receipts and inspection." if inv_status == "Verified Legitimate" else None)
                    ),
                    started_at=datetime.utcnow()
                )
                db.add(investigation)

            db.commit()
            print("Successfully populated initial 600 claims, predictions, and investigation files.")

def get_claims_paginated(
    db: Session,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    insurance_type: Optional[str] = None,
    risk_category: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at",
    sort_desc: bool = True
) -> Tuple[int, List[Dict[str, Any]]]:
    """Queries claims with filtering, sorting, and pagination."""
    query = db.query(InsuranceClaim)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                InsuranceClaim.claim_id.ilike(search_filter),
                InsuranceClaim.customer_name.ilike(search_filter),
                InsuranceClaim.policy_number.ilike(search_filter),
                InsuranceClaim.incident_location.ilike(search_filter)
            )
        )

    if insurance_type and insurance_type != "All":
        query = query.filter(InsuranceClaim.insurance_type == insurance_type)

    if risk_category and risk_category != "All":
        query = query.join(FraudPrediction).filter(FraudPrediction.risk_category == risk_category)

    if status and status != "All":
        query = query.join(Investigation).filter(Investigation.status == status)

    total = query.count()

    # Sorting
    if sort_desc:
        query = query.order_by(desc(getattr(InsuranceClaim, sort_by, InsuranceClaim.id)))
    else:
        query = query.order_by(asc(getattr(InsuranceClaim, sort_by, InsuranceClaim.id)))

    offset = (page - 1) * limit
    claims = query.offset(offset).limit(limit).all()

    items = []
    for c in claims:
        pred = c.prediction
        inv = c.investigation
        items.append({
            "id": c.id,
            "claim_id": c.claim_id,
            "customer_name": c.customer_name,
            "policy_number": c.policy_number,
            "insurance_type": c.insurance_type,
            "claim_amount": c.claim_amount,
            "incident_date": c.incident_date,
            "claim_submission_date": c.claim_submission_date,
            "incident_location": c.incident_location,
            "damage_severity": c.damage_severity,
            "status": c.status,
            "risk_score": pred.risk_score if pred else 0,
            "risk_category": pred.risk_category if pred else "Low",
            "investigation_status": inv.status if inv else "Pending Review"
        })

    return total, items

def get_claim_detail_by_id(db: Session, claim_id: str) -> Optional[Dict[str, Any]]:
    """Fetches full claim details including predictions, SHAP, and investigation notes."""
    claim = db.query(InsuranceClaim).filter(InsuranceClaim.claim_id == claim_id).first()
    if not claim:
        return None

    pred = claim.prediction
    inv = claim.investigation

    prediction_dict = None
    if pred:
        top_indicators = json.loads(pred.top_risk_indicators) if pred.top_risk_indicators else []
        shap_items = json.loads(pred.shap_values_json) if pred.shap_values_json else []
        checklist = json.loads(pred.checklist_json) if pred.checklist_json else []

        # If SHAP items were empty (from seeded data), compute real-time SHAP explanation
        if not shap_items:
            try:
                ml_res = ml_service.predict_claim({
                    "customer_age": claim.customer_age,
                    "annual_income": 65000,
                    "credit_score": 670,
                    "coverage_limit": claim.claim_amount * 1.5,
                    "deductible": 1000,
                    "premium_amount": 1500,
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
                    "supporting_documents_count": 2
                })
                shap_items = ml_res["shap_contributions"]
                if not checklist:
                    checklist = ml_res["investigation_checklist"]
            except Exception as e:
                print(f"SHAP on-the-fly calculation error: {e}")

        prediction_dict = {
            "claim_id": pred.claim_id,
            "risk_score": pred.risk_score,
            "risk_category": pred.risk_category,
            "anomaly_score": pred.anomaly_score,
            "model_name": pred.model_name,
            "model_version": pred.model_version,
            "top_risk_indicators": top_indicators,
            "shap_contributions": shap_items,
            "investigation_checklist": checklist,
            "natural_language_explanation": pred.explanation_text or "",
            "predicted_at": pred.predicted_at
        }

    investigation_dict = None
    if inv:
        notes_list = [
            {
                "id": n.id,
                "investigation_id": n.investigation_id,
                "user_id": n.user_id,
                "author_name": n.author_name,
                "note_text": n.note_text,
                "created_at": n.created_at
            }
            for n in inv.notes
        ]
        investigation_dict = {
            "id": inv.id,
            "claim_id": inv.claim_id,
            "assigned_to_id": inv.assigned_to_id,
            "assigned_to_name": inv.assigned_to_name,
            "status": inv.status,
            "priority": inv.priority,
            "outcome_reason": inv.outcome_reason,
            "started_at": inv.started_at,
            "completed_at": inv.completed_at,
            "updated_at": inv.updated_at,
            "notes": notes_list
        }

    return {
        "id": claim.id,
        "claim_id": claim.claim_id,
        "customer_id": claim.customer_id,
        "customer_name": claim.customer_name,
        "customer_age": claim.customer_age,
        "policy_number": claim.policy_number,
        "insurance_type": claim.insurance_type,
        "claim_amount": claim.claim_amount,
        "policy_start_date": claim.policy_start_date,
        "incident_date": claim.incident_date,
        "claim_submission_date": claim.claim_submission_date,
        "incident_location": claim.incident_location,
        "region": claim.region,
        "incident_type": claim.incident_type,
        "damage_severity": claim.damage_severity,
        "police_report_filed": claim.police_report_filed,
        "witness_present": claim.witness_present,
        "number_of_previous_claims": claim.number_of_previous_claims,
        "previous_claim_payouts": claim.previous_claim_payouts,
        "incident_description": claim.incident_description,
        "supporting_documents": claim.supporting_documents,
        "status": claim.status,
        "created_at": claim.created_at,
        "updated_at": claim.updated_at,
        "prediction": prediction_dict,
        "investigation": investigation_dict
    }

def create_new_claim(db: Session, claim_in: ClaimCreate, user: User) -> Dict[str, Any]:
    """Creates a new claim, triggers ML model inference, and creates an investigation."""
    # Generate unique Claim ID
    count = db.query(InsuranceClaim).count()
    new_claim_id = f"CLM-{30000 + count + 1}"

    claim = InsuranceClaim(
        claim_id=new_claim_id,
        customer_id=claim_in.customer_id,
        customer_name=claim_in.customer_name,
        policy_number=claim_in.policy_number,
        customer_age=claim_in.customer_age,
        insurance_type=claim_in.insurance_type,
        claim_amount=claim_in.claim_amount,
        policy_start_date=claim_in.policy_start_date,
        incident_date=claim_in.incident_date,
        claim_submission_date=claim_in.claim_submission_date,
        incident_location=claim_in.incident_location,
        region=claim_in.region,
        incident_type=claim_in.incident_type,
        damage_severity=claim_in.damage_severity,
        police_report_filed=claim_in.police_report_filed,
        witness_present=claim_in.witness_present,
        previous_claim_history=claim_in.previous_claim_history,
        number_of_previous_claims=claim_in.number_of_previous_claims,
        previous_claim_payouts=claim_in.previous_claim_payouts,
        incident_description=claim_in.incident_description,
        supporting_documents=claim_in.supporting_documents or "",
        status="Under Review"
    )
    db.add(claim)
    db.flush()

    # Trigger ML Inference
    ml_input = {
        "customer_age": claim_in.customer_age,
        "annual_income": 65000,
        "credit_score": 670,
        "coverage_limit": claim_in.claim_amount * 1.5,
        "deductible": 1000,
        "premium_amount": 1800,
        "claim_amount": claim_in.claim_amount,
        "policy_start_date": claim_in.policy_start_date,
        "incident_date": claim_in.incident_date,
        "claim_submission_date": claim_in.claim_submission_date,
        "insurance_type": claim_in.insurance_type,
        "region": claim_in.region,
        "damage_severity": claim_in.damage_severity,
        "police_report_filed": claim_in.police_report_filed,
        "witness_present": claim_in.witness_present,
        "number_of_previous_claims": claim_in.number_of_previous_claims,
        "previous_claim_payouts": claim_in.previous_claim_payouts,
        "supporting_documents_count": len(claim_in.supporting_documents.split(";")) if claim_in.supporting_documents else 0
    }
    ml_result = ml_service.predict_claim(ml_input)

    prediction = FraudPrediction(
        claim_id=new_claim_id,
        risk_score=ml_result["risk_score"],
        risk_category=ml_result["risk_category"],
        anomaly_score=ml_result["anomaly_score"],
        model_name=ml_result["model_name"],
        model_version=ml_result["model_version"],
        top_risk_indicators=json.dumps(ml_result["top_risk_indicators"]),
        shap_values_json=json.dumps(ml_result["shap_contributions"]),
        checklist_json=json.dumps(ml_result["investigation_checklist"]),
        explanation_text=ml_result["natural_language_explanation"]
    )
    db.add(prediction)

    # Initialize Investigation
    priority = "Critical" if ml_result["risk_score"] >= 80 else ("High" if ml_result["risk_category"] == "High" else "Medium")
    investigation = Investigation(
        claim_id=new_claim_id,
        status="Pending Review",
        priority=priority,
        started_at=datetime.utcnow()
    )
    db.add(investigation)

    # Audit Log
    log_audit_event(
        db=db,
        action="CLAIM_CREATED",
        entity_type="Claim",
        entity_id=new_claim_id,
        details=f"Claim created by {user.username} with initial fraud score {ml_result['risk_score']}/100 ({ml_result['risk_category']})",
        user_id=user.id,
        username=user.username
    )

    db.commit()
    return get_claim_detail_by_id(db, new_claim_id)
