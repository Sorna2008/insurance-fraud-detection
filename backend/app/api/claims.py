from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..models import User, InsuranceClaim
from ..schemas import (
    ClaimCreate, ClaimUpdate, ClaimDetailResponse, ClaimListPaginatedResponse
)
from ..services.auth_service import get_current_user, require_roles
from ..services.claim_service import (
    get_claims_paginated, get_claim_detail_by_id, create_new_claim
)
from ..services.audit_service import log_audit_event

router = APIRouter(prefix="/claims", tags=["Insurance Claims"])

@router.get("", response_model=ClaimListPaginatedResponse)
def list_claims(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    insurance_type: Optional[str] = Query(None),
    risk_category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_desc: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total, items = get_claims_paginated(
        db=db,
        page=page,
        limit=limit,
        search=search,
        insurance_type=insurance_type,
        risk_category=risk_category,
        status=status,
        sort_by=sort_by,
        sort_desc=sort_desc
    )
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "items": items
    }

@router.post("", response_model=ClaimDetailResponse)
def create_claim(
    claim_in: ClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Claims Officer", "Fraud Investigator"]))
):
    new_claim = create_new_claim(db=db, claim_in=claim_in, user=current_user)
    return new_claim

@router.get("/{claim_id}", response_model=ClaimDetailResponse)
def get_claim(
    claim_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    claim_detail = get_claim_detail_by_id(db, claim_id)
    if not claim_detail:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim_detail

@router.put("/{claim_id}", response_model=ClaimDetailResponse)
def update_claim(
    claim_id: str,
    claim_update: ClaimUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Claims Officer", "Fraud Investigator"]))
):
    claim = db.query(InsuranceClaim).filter(InsuranceClaim.claim_id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    update_data = claim_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(claim, field, value)

    db.commit()
    log_audit_event(
        db=db,
        action="CLAIM_UPDATED",
        entity_type="Claim",
        entity_id=claim_id,
        details=f"Claim fields updated: {list(update_data.keys())} by {current_user.username}",
        user_id=current_user.id,
        username=current_user.username
    )
    return get_claim_detail_by_id(db, claim_id)
