from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from ..database import get_db
from ..models import User
from ..schemas import InvestigationUpdate, InvestigationNoteCreate, InvestigationNoteResponse
from ..services.auth_service import get_current_user, require_roles
from ..services.investigation_service import (
    get_investigations_list, update_investigation, add_investigation_note
)

router = APIRouter(prefix="/investigations", tags=["Fraud Investigations"])

@router.get("")
def list_investigations(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assigned_to_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_investigations_list(
        db=db,
        status_filter=status,
        priority_filter=priority,
        assigned_to_id=assigned_to_id
    )

@router.put("/{investigation_id}")
def update_investigation_record(
    investigation_id: int,
    inv_update: InvestigationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Fraud Investigator"]))
):
    """
    Updates investigation status, assignment, or records outcome.
    Strictly restricted to human investigators and admins.
    """
    updated = update_investigation(
        db=db,
        investigation_id=investigation_id,
        inv_update=inv_update,
        user=current_user
    )
    return {"status": "success", "id": updated.id, "current_status": updated.status}

@router.post("/{investigation_id}/notes", response_model=InvestigationNoteResponse)
def add_note(
    investigation_id: int,
    note_in: InvestigationNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Admin", "Fraud Investigator", "Claims Officer"]))
):
    return add_investigation_note(
        db=db,
        investigation_id=investigation_id,
        note_in=note_in,
        user=current_user
    )
