from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# ----------------- User Schemas -----------------
class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    role: str = "Fraud Investigator" # Admin, Fraud Investigator, Claims Officer

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ----------------- Claim Schemas -----------------
class ClaimCreate(BaseModel):
    customer_id: str
    customer_name: str
    customer_age: int = Field(..., ge=18, le=100)
    policy_number: str
    insurance_type: str # Auto, Property, Health, Life
    claim_amount: float = Field(..., gt=0)
    policy_start_date: str # YYYY-MM-DD
    incident_date: str # YYYY-MM-DD
    claim_submission_date: str # YYYY-MM-DD
    incident_location: str
    region: str = "Northeast"
    incident_type: str
    damage_severity: str = "Moderate"
    police_report_filed: str = "No"
    witness_present: str = "No"
    previous_claim_history: Optional[str] = None
    number_of_previous_claims: int = 0
    previous_claim_payouts: float = 0.0
    incident_description: str
    supporting_documents: Optional[str] = None

class ClaimUpdate(BaseModel):
    customer_name: Optional[str] = None
    claim_amount: Optional[float] = None
    incident_location: Optional[str] = None
    incident_type: Optional[str] = None
    damage_severity: Optional[str] = None
    police_report_filed: Optional[str] = None
    witness_present: Optional[str] = None
    incident_description: Optional[str] = None
    status: Optional[str] = None

# ----------------- Prediction & SHAP Schemas -----------------
class RiskIndicatorItem(BaseModel):
    feature: str
    label: str
    value: float
    shap_value: float
    impact: str

class FraudPredictionResponse(BaseModel):
    claim_id: str
    risk_score: int
    risk_category: str # Low, Medium, High
    anomaly_score: float
    model_name: str
    model_version: str
    top_risk_indicators: List[str]
    shap_contributions: List[RiskIndicatorItem]
    investigation_checklist: List[str]
    natural_language_explanation: str
    predicted_at: datetime

    class Config:
        from_attributes = True

# ----------------- Investigation Schemas -----------------
class InvestigationNoteCreate(BaseModel):
    note_text: str

class InvestigationNoteResponse(BaseModel):
    id: int
    investigation_id: int
    user_id: int
    author_name: str
    note_text: str
    created_at: datetime

    class Config:
        from_attributes = True

class InvestigationUpdate(BaseModel):
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    outcome_reason: Optional[str] = None

class InvestigationResponse(BaseModel):
    id: int
    claim_id: str
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    status: str
    priority: str
    outcome_reason: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    updated_at: datetime
    notes: List[InvestigationNoteResponse] = []

    class Config:
        from_attributes = True

# ----------------- Combined Claim Detail Schema -----------------
class ClaimDetailResponse(BaseModel):
    id: int
    claim_id: str
    customer_id: str
    customer_name: str
    customer_age: int
    policy_number: str
    insurance_type: str
    claim_amount: float
    policy_start_date: str
    incident_date: str
    claim_submission_date: str
    incident_location: str
    region: str
    incident_type: str
    damage_severity: str
    police_report_filed: str
    witness_present: str
    number_of_previous_claims: int
    previous_claim_payouts: float
    incident_description: str
    supporting_documents: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    
    # Associated predictions & investigation
    prediction: Optional[FraudPredictionResponse] = None
    investigation: Optional[InvestigationResponse] = None

    class Config:
        from_attributes = True

class ClaimListItemResponse(BaseModel):
    id: int
    claim_id: str
    customer_name: str
    policy_number: str
    insurance_type: str
    claim_amount: float
    incident_date: str
    claim_submission_date: str
    incident_location: str
    damage_severity: str
    status: str
    risk_score: Optional[int] = 0
    risk_category: Optional[str] = "Low"
    investigation_status: Optional[str] = "Pending Review"

class ClaimListPaginatedResponse(BaseModel):
    total: int
    page: int
    limit: int
    items: List[ClaimListItemResponse]

# ----------------- Audit & Analytics Schemas -----------------
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: str
    action: str
    entity_type: str
    entity_id: str
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class DashboardKPIs(BaseModel):
    total_claims: int
    legitimate_claims: int
    suspicious_claims: int
    high_risk_claims: int
    fraud_risk_percentage: float
    total_claim_amount: float
    estimated_potential_fraud_exposure: float
    pending_investigations: int

class TrendPoint(BaseModel):
    month: str
    total_claims: int
    flagged_fraud: int
    total_amount: float
    fraud_exposure: float

class CategoryDistribution(BaseModel):
    insurance_type: str
    total_claims: int
    fraud_claims: int
    fraud_rate: float

class RiskDistribution(BaseModel):
    category: str
    count: int
    percentage: float

class RegionalDistribution(BaseModel):
    region: str
    claims_count: int
    fraud_count: int
    fraud_rate: float
    total_exposure: float

class DashboardOverviewResponse(BaseModel):
    kpis: DashboardKPIs
    monthly_trends: List[TrendPoint]
    category_distribution: List[CategoryDistribution]
    risk_distribution: List[RiskDistribution]
    regional_distribution: List[RegionalDistribution]
