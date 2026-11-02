from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import User, AuditLog
from ..schemas import DashboardOverviewResponse, AuditLogResponse
from ..services.auth_service import get_current_user, require_roles
from ..services.analytics_service import get_dashboard_overview, get_advanced_analytics

router = APIRouter(prefix="/analytics", tags=["Fraud Analytics & Audit"])

@router.get("/overview", response_model=DashboardOverviewResponse)
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_dashboard_overview(db)

@router.get("/advanced")
def get_advanced_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_advanced_analytics(db)

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_trail(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Fraud Investigator"]))
):
    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )
    return logs
