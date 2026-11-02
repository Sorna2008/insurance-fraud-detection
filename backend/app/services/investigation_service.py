from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models import Investigation, InvestigationNote, InsuranceClaim, User
from ..schemas import InvestigationUpdate, InvestigationNoteCreate
from .audit_service import log_audit_event

def get_investigations_list(
    db: Session,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    assigned_to_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    query = db.query(Investigation).join(InsuranceClaim)
    
    if status_filter and status_filter != "All":
        query = query.filter(Investigation.status == status_filter)
    if priority_filter and priority_filter != "All":
        query = query.filter(Investigation.priority == priority_filter)
    if assigned_to_id:
        query = query.filter(Investigation.assigned_to_id == assigned_to_id)
        
    investigations = query.order_by(Investigation.updated_at.desc()).all()
    
    res = []
    for inv in investigations:
        claim = inv.claim
        pred = claim.prediction if claim else None
        res.append({
            "id": inv.id,
            "claim_id": inv.claim_id,
            "customer_name": claim.customer_name if claim else "Unknown",
            "insurance_type": claim.insurance_type if claim else "Unknown",
            "claim_amount": claim.claim_amount if claim else 0.0,
            "risk_score": pred.risk_score if pred else 0,
            "risk_category": pred.risk_category if pred else "Low",
            "assigned_to_id": inv.assigned_to_id,
            "assigned_to_name": inv.assigned_to_name,
            "status": inv.status,
            "priority": inv.priority,
            "outcome_reason": inv.outcome_reason,
            "started_at": inv.started_at,
            "completed_at": inv.completed_at,
            "updated_at": inv.updated_at,
            "notes_count": len(inv.notes)
        })
    return res

def update_investigation(
    db: Session,
    investigation_id: int,
    inv_update: InvestigationUpdate,
    user: User
) -> Investigation:
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation record not found")

    old_status = inv.status
    if inv_update.status:
        inv.status = inv_update.status
        if inv.status in ["Verified Legitimate", "Confirmed Fraud", "Inconclusive"]:
            inv.completed_at = datetime.utcnow()
            # Also update the claim status accordingly
            if inv.claim:
                inv.claim.status = "Approved" if inv.status == "Verified Legitimate" else ("Declined" if inv.status == "Confirmed Fraud" else "Closed")

    if inv_update.assigned_to_id is not None:
        inv.assigned_to_id = inv_update.assigned_to_id
        assigned_user = db.query(User).filter(User.id == inv_update.assigned_to_id).first()
        inv.assigned_to_name = assigned_user.full_name if assigned_user else None

    if inv_update.priority:
        inv.priority = inv_update.priority

    if inv_update.outcome_reason is not None:
        inv.outcome_reason = inv_update.outcome_reason

    inv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(inv)

    log_audit_event(
        db=db,
        action="INVESTIGATION_UPDATED",
        entity_type="Investigation",
        entity_id=str(inv.id),
        details=f"Status changed from '{old_status}' to '{inv.status}' by {user.username}. Outcome: {inv.outcome_reason or 'In progress'}",
        user_id=user.id,
        username=user.username
    )
    return inv

def add_investigation_note(
    db: Session,
    investigation_id: int,
    note_in: InvestigationNoteCreate,
    user: User
) -> InvestigationNote:
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    note = InvestigationNote(
        investigation_id=investigation_id,
        user_id=user.id,
        author_name=user.full_name,
        note_text=note_in.note_text,
        created_at=datetime.utcnow()
    )
    db.add(note)
    inv.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)

    log_audit_event(
        db=db,
        action="NOTE_ADDED",
        entity_type="Investigation",
        entity_id=str(investigation_id),
        details=f"Investigator note added by {user.username}",
        user_id=user.id,
        username=user.username
    )
    return note
