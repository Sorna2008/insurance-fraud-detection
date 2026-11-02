from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from ..database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(30), nullable=False, default="Fraud Investigator") # Admin, Fraud Investigator, Claims Officer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    annual_income = Column(Float, nullable=False)
    credit_score = Column(Integer, nullable=False)
    email = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    policy_id = Column(String(50), unique=True, index=True, nullable=False)
    policy_number = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"), nullable=False)
    insurance_type = Column(String(30), nullable=False) # Auto, Property, Health, Life
    coverage_limit = Column(Float, nullable=False)
    deductible = Column(Float, nullable=False)
    premium_amount = Column(Float, nullable=False)
    start_date = Column(String(30), nullable=False)
    is_active = Column(Boolean, default=True)

class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String(50), unique=True, index=True, nullable=False)
    customer_id = Column(String(50), index=True, nullable=False)
    customer_name = Column(String(100), nullable=False)
    policy_number = Column(String(50), index=True, nullable=False)
    customer_age = Column(Integer, nullable=False)
    insurance_type = Column(String(30), index=True, nullable=False)
    claim_amount = Column(Float, nullable=False)
    policy_start_date = Column(String(30), nullable=False)
    incident_date = Column(String(30), nullable=False)
    claim_submission_date = Column(String(30), nullable=False)
    incident_location = Column(String(100), nullable=False)
    region = Column(String(50), index=True, nullable=False)
    incident_type = Column(String(100), nullable=False)
    damage_severity = Column(String(30), nullable=False)
    police_report_filed = Column(String(10), nullable=False, default="No")
    witness_present = Column(String(10), nullable=False, default="No")
    previous_claim_history = Column(Text, nullable=True)
    number_of_previous_claims = Column(Integer, default=0)
    previous_claim_payouts = Column(Float, default=0.0)
    incident_description = Column(Text, nullable=False)
    supporting_documents = Column(Text, nullable=True)
    status = Column(String(40), default="Under Review")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    prediction = relationship("FraudPrediction", back_populates="claim", uselist=False, cascade="all, delete-orphan")
    investigation = relationship("Investigation", back_populates="claim", uselist=False, cascade="all, delete-orphan")

class FraudPrediction(Base):
    __tablename__ = "fraud_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String(50), ForeignKey("insurance_claims.claim_id"), unique=True, index=True, nullable=False)
    risk_score = Column(Integer, nullable=False) # 0 to 100
    risk_category = Column(String(20), index=True, nullable=False) # Low, Medium, High
    anomaly_score = Column(Float, default=0.0)
    model_name = Column(String(50), default="XGBoost Champion + Isolation Forest")
    model_version = Column(String(20), default="1.0.0")
    top_risk_indicators = Column(Text, nullable=True) # JSON list
    shap_values_json = Column(Text, nullable=True) # JSON list
    checklist_json = Column(Text, nullable=True) # JSON list
    explanation_text = Column(Text, nullable=True)
    predicted_at = Column(DateTime, default=datetime.utcnow)

    claim = relationship("InsuranceClaim", back_populates="prediction")

class Investigation(Base):
    __tablename__ = "investigations"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String(50), ForeignKey("insurance_claims.claim_id"), unique=True, index=True, nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_to_name = Column(String(100), nullable=True)
    status = Column(
        String(50),
        default="Pending Review",
        index=True
    ) # Pending Review, Under Investigation, Additional Information Required, Verified Legitimate, Confirmed Fraud, Inconclusive
    priority = Column(String(20), default="Medium") # Low, Medium, High, Critical
    outcome_reason = Column(Text, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    claim = relationship("InsuranceClaim", back_populates="investigation")
    notes = relationship("InvestigationNote", back_populates="investigation", cascade="all, delete-orphan")

class InvestigationNote(Base):
    __tablename__ = "investigation_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author_name = Column(String(100), nullable=False)
    note_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    investigation = relationship("Investigation", back_populates="notes")

class SupportingDocument(Base):
    __tablename__ = "supporting_documents"
    
    id = Column(Integer, primary_key=True, index=True)
    claim_id = Column(String(50), index=True, nullable=False)
    investigation_id = Column(Integer, nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    uploaded_by = Column(String(100), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(100), nullable=False, default="System")
    action = Column(String(100), index=True, nullable=False)
    entity_type = Column(String(50), index=True, nullable=False)
    entity_id = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
