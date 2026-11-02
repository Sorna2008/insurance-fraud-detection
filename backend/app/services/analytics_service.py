from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from ..models import InsuranceClaim, FraudPrediction, Investigation
from .ml_service import ml_service

def get_dashboard_overview(db: Session) -> Dict[str, Any]:
    """Computes real-time KPI metrics and dashboard distributions."""
    total_claims = db.query(InsuranceClaim).count()
    if total_claims == 0:
        return {
            "kpis": {
                "total_claims": 0,
                "legitimate_claims": 0,
                "suspicious_claims": 0,
                "high_risk_claims": 0,
                "fraud_risk_percentage": 0.0,
                "total_claim_amount": 0.0,
                "estimated_potential_fraud_exposure": 0.0,
                "pending_investigations": 0
            },
            "monthly_trends": [],
            "category_distribution": [],
            "risk_distribution": [],
            "regional_distribution": []
        }

    # Count by Risk Category
    risk_counts = (
        db.query(FraudPrediction.risk_category, func.count(FraudPrediction.id))
        .group_by(FraudPrediction.risk_category)
        .all()
    )
    risk_dict = {cat: count for cat, count in risk_counts}
    low_count = risk_dict.get("Low", 0)
    med_count = risk_dict.get("Medium", 0)
    high_count = risk_dict.get("High", 0)
    fraud_risk_pct = round(((med_count + high_count) / max(total_claims, 1)) * 100, 1)

    # Claim Amounts
    total_amount_res = db.query(func.sum(InsuranceClaim.claim_amount)).scalar() or 0.0
    
    # Potential fraud exposure (claims with High or Medium risk)
    exposure_res = (
        db.query(func.sum(InsuranceClaim.claim_amount))
        .join(FraudPrediction)
        .filter(FraudPrediction.risk_category.in_(["High", "Medium"]))
        .scalar() or 0.0
    )

    # Pending investigations count
    pending_count = (
        db.query(Investigation)
        .filter(Investigation.status.in_(["Pending Review", "Under Investigation", "Additional Information Required"]))
        .count()
    )

    kpis = {
        "total_claims": total_claims,
        "legitimate_claims": low_count,
        "suspicious_claims": med_count,
        "high_risk_claims": high_count,
        "fraud_risk_percentage": fraud_risk_pct,
        "total_claim_amount": round(float(total_amount_res), 2),
        "estimated_potential_fraud_exposure": round(float(exposure_res), 2),
        "pending_investigations": pending_count
    }

    # Monthly Trends (aggregated by submission month YYYY-MM)
    claims_raw = (
        db.query(
            InsuranceClaim.claim_submission_date,
            InsuranceClaim.claim_amount,
            FraudPrediction.risk_category
        )
        .join(FraudPrediction)
        .all()
    )

    monthly_map = {}
    for sub_date, amount, cat in claims_raw:
        if sub_date and len(sub_date) >= 7:
            m_key = sub_date[:7] # 'YYYY-MM'
            if m_key not in monthly_map:
                monthly_map[m_key] = {"total": 0, "fraud": 0, "amount": 0.0, "exposure": 0.0}
            monthly_map[m_key]["total"] += 1
            monthly_map[m_key]["amount"] += float(amount or 0)
            if cat in ["High", "Medium"]:
                monthly_map[m_key]["fraud"] += 1
                monthly_map[m_key]["exposure"] += float(amount or 0)

    sorted_months = sorted(monthly_map.keys())[-8:] # Last 8 months
    monthly_trends = [
        {
            "month": m,
            "total_claims": monthly_map[m]["total"],
            "flagged_fraud": monthly_map[m]["fraud"],
            "total_amount": round(monthly_map[m]["amount"], 2),
            "fraud_exposure": round(monthly_map[m]["exposure"], 2)
        }
        for m in sorted_months
    ]

    # Category Distribution
    cat_query = (
        db.query(
            InsuranceClaim.insurance_type,
            func.count(InsuranceClaim.id),
            func.sum(
                case(
                    (FraudPrediction.risk_category.in_(["High", "Medium"]), 1),
                    else_=0
                )
            )
        )
        .join(FraudPrediction)
        .group_by(InsuranceClaim.insurance_type)
        .all()
    )
    category_distribution = [
        {
            "insurance_type": c_type,
            "total_claims": total,
            "fraud_claims": int(fraud_c or 0),
            "fraud_rate": round((int(fraud_c or 0) / max(total, 1)) * 100, 1)
        }
        for c_type, total, fraud_c in cat_query
    ]

    # Risk Distribution
    risk_distribution = [
        {
            "category": "Low Risk",
            "count": low_count,
            "percentage": round((low_count / max(total_claims, 1)) * 100, 1),
            "color": "#10b981"
        },
        {
            "category": "Medium Risk",
            "count": med_count,
            "percentage": round((med_count / max(total_claims, 1)) * 100, 1),
            "color": "#f59e0b"
        },
        {
            "category": "High Risk",
            "count": high_count,
            "percentage": round((high_count / max(total_claims, 1)) * 100, 1),
            "color": "#ef4444"
        }
    ]

    # Regional Distribution
    reg_query = (
        db.query(
            InsuranceClaim.region,
            func.count(InsuranceClaim.id),
            func.sum(
                case(
                    (FraudPrediction.risk_category.in_(["High", "Medium"]), 1),
                    else_=0
                )
            ),
            func.sum(
                case(
                    (FraudPrediction.risk_category.in_(["High", "Medium"]), InsuranceClaim.claim_amount),
                    else_=0.0
                )
            )
        )
        .join(FraudPrediction)
        .group_by(InsuranceClaim.region)
        .all()
    )
    regional_distribution = [
        {
            "region": reg,
            "claims_count": total,
            "fraud_count": int(fraud_c or 0),
            "fraud_rate": round((int(fraud_c or 0) / max(total, 1)) * 100, 1),
            "total_exposure": round(float(exp or 0.0), 2)
        }
        for reg, total, fraud_c, exp in reg_query
    ]

    return {
        "kpis": kpis,
        "monthly_trends": monthly_trends,
        "category_distribution": category_distribution,
        "risk_distribution": risk_distribution,
        "regional_distribution": regional_distribution
    }

def get_advanced_analytics(db: Session) -> Dict[str, Any]:
    """Retrieves deep model performance metrics, benchmark comparisons, and distributions."""
    metrics = ml_service.get_benchmark_metrics()
    overview = get_dashboard_overview(db)
    return {
        "model_benchmarks": metrics,
        "dashboard_summary": overview
    }
