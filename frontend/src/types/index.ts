export type UserRole = "Admin" | "Fraud Investigator" | "Claims Officer";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

export type RiskCategory = "Low" | "Medium" | "High";

export type InvestigationStatus =
  | "Pending Review"
  | "Under Investigation"
  | "Additional Information Required"
  | "Verified Legitimate"
  | "Confirmed Fraud"
  | "Inconclusive";

export interface ShapContribution {
  feature: string;
  label: string;
  value: number;
  shap_value: number;
  impact: string;
}

export interface FraudPrediction {
  claim_id: string;
  risk_score: number;
  risk_category: RiskCategory;
  anomaly_score: number;
  model_name: string;
  model_version: string;
  top_risk_indicators: string[];
  shap_contributions: ShapContribution[];
  all_shap_contributions?: ShapContribution[];
  investigation_checklist: string[];
  natural_language_explanation: string;
  predicted_at: string;
}

export interface InvestigationNote {
  id: number;
  investigation_id: number;
  user_id: number;
  author_name: string;
  note_text: string;
  created_at: string;
}

export interface Investigation {
  id: number;
  claim_id: string;
  assigned_to_id?: number | null;
  assigned_to_name?: string | null;
  status: InvestigationStatus;
  priority: "Low" | "Medium" | "High" | "Critical";
  outcome_reason?: string | null;
  started_at: string;
  completed_at?: string | null;
  updated_at: string;
  notes: InvestigationNote[];
}

export interface Claim {
  id: number;
  claim_id: string;
  customer_id: string;
  customer_name: string;
  customer_age: number;
  policy_number: string;
  insurance_type: "Auto" | "Property" | "Health" | "Life" | string;
  claim_amount: number;
  policy_start_date: string;
  incident_date: string;
  claim_submission_date: string;
  incident_location: string;
  region: string;
  incident_type: string;
  damage_severity: "Minor" | "Moderate" | "Major" | "Total Loss" | string;
  police_report_filed: "Yes" | "No";
  witness_present: "Yes" | "No";
  number_of_previous_claims: number;
  previous_claim_payouts: number;
  incident_description: string;
  supporting_documents?: string;
  status: string;
  created_at: string;
  updated_at: string;
  prediction?: FraudPrediction;
  investigation?: Investigation;
}

export interface ClaimListItem {
  id: number;
  claim_id: string;
  customer_name: string;
  policy_number: string;
  insurance_type: string;
  claim_amount: number;
  incident_date: string;
  claim_submission_date: string;
  incident_location: string;
  damage_severity: string;
  status: string;
  risk_score: number;
  risk_category: RiskCategory;
  investigation_status: InvestigationStatus;
}

export interface DashboardKPIs {
  total_claims: number;
  legitimate_claims: number;
  suspicious_claims: number;
  high_risk_claims: number;
  fraud_risk_percentage: number;
  total_claim_amount: number;
  estimated_potential_fraud_exposure: number;
  pending_investigations: number;
}

export interface MonthlyTrend {
  month: string;
  total_claims: number;
  flagged_fraud: number;
  total_amount: number;
  fraud_exposure: number;
}

export interface CategoryDistribution {
  insurance_type: string;
  total_claims: number;
  fraud_claims: number;
  fraud_rate: number;
}

export interface RiskDistribution {
  category: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface RegionalDistribution {
  region: string;
  claims_count: number;
  fraud_count: number;
  fraud_rate: number;
  total_exposure: number;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  monthly_trends: MonthlyTrend[];
  category_distribution: CategoryDistribution[];
  risk_distribution: RiskDistribution[];
  regional_distribution: RegionalDistribution[];
}

export interface ModelMetrics {
  name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  confusion_matrix: {
    tn: number;
    fp: number;
    fn: number;
    tp: number;
  };
  roc_curve: Array<{ fpr: number; tpr: number }>;
}

export interface BenchmarkData {
  dataset_size: number;
  test_size: number;
  fraud_rate: number;
  champion: string;
  models: {
    xgboost: ModelMetrics;
    random_forest: ModelMetrics;
    logistic_regression: ModelMetrics;
    isolation_forest: {
      name: string;
      description: string;
      contamination: number;
      n_estimators: number;
    };
  };
  feature_importances: Array<{ feature: string; importance: number }>;
  version: string;
  last_trained: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  username: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: string;
  timestamp: string;
}
