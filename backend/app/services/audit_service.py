from typing import Optional
from sqlalchemy.orm import Session
from ..models import AuditLog

def log_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    details: Optional[str] = None,
    user_id: Optional[int] = None,
    username: str = "System",
    ip_address: Optional[str] = None,
) -> AuditLog:
    log_entry = AuditLog(
        user_id=user_id,
        username=username,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        details=details,
        ip_address=ip_address,
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
