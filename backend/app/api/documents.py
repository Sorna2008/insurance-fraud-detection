import os
import shutil
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from ..config import settings
from ..database import get_db
from ..models import User, SupportingDocument
from ..services.auth_service import get_current_user
from ..services.audit_service import log_audit_event

router = APIRouter(prefix="/documents", tags=["Supporting Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".zip", ".csv", ".docx"}
MAX_FILE_SIZE = 15 * 1024 * 1024 # 15 MB

@router.post("/upload")
async def upload_supporting_document(
    claim_id: str = Form(...),
    investigation_id: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Extension validation
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Make upload directory
    os.makedirs(settings.UPLOADS_DIR, exist_ok=True)
    safe_filename = f"{claim_id}_{int(os.times().elapsed * 1000)}_{os.path.basename(file.filename)}"
    destination_path = os.path.join(settings.UPLOADS_DIR, safe_filename)

    file_size = 0
    with open(destination_path, "wb") as buffer:
        while chunk := await file.read(1024 * 64):
            file_size += len(chunk)
            if file_size > MAX_FILE_SIZE:
                os.remove(destination_path)
                raise HTTPException(status_code=400, detail="File exceeds 15 MB limit")
            buffer.write(chunk)

    doc_entry = SupportingDocument(
        claim_id=claim_id,
        investigation_id=investigation_id,
        file_name=file.filename,
        file_path=destination_path,
        file_size=file_size,
        mime_type=file.content_type or "application/octet-stream",
        uploaded_by=current_user.full_name
    )
    db.add(doc_entry)
    db.commit()
    db.refresh(doc_entry)

    log_audit_event(
        db=db,
        action="DOCUMENT_UPLOADED",
        entity_type="Claim",
        entity_id=claim_id,
        details=f"Evidence document '{file.filename}' ({file_size} bytes) uploaded by {current_user.username}",
        user_id=current_user.id,
        username=current_user.username
    )

    return {
        "status": "success",
        "id": doc_entry.id,
        "filename": doc_entry.file_name,
        "size": doc_entry.file_size,
        "uploaded_at": doc_entry.uploaded_at
    }
