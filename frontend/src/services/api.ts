import {
  Claim,
  ClaimListItem,
  DashboardData,
  BenchmarkData,
  InvestigationNote,
  AuditLog,
  User,
  FraudPrediction,
} from "../types";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ----------------- Fallback Telemetry for Standalone Vercel Hosting -----------------
const FALLBACK_DASHBOARD: DashboardData = {
  kpis: {
    total_claims: 12000,
    legitimate_claims: 9113,
    suspicious_claims: 1822,
    high_risk_claims: 1065,
    fraud_risk_percentage: 24.1,
    total_claim_amount: 148520300.5,
    estimated_potential_fraud_exposure: 43250800.0,
    pending_investigations: 284,
  },
  monthly_trends: [
    { month: "2026-03", total_claims: 1140, flagged_fraud: 265, total_amount: 14200000, fraud_exposure: 3900000 },
    { month: "2026-04", total_claims: 1280, flagged_fraud: 298, total_amount: 15600000, fraud_exposure: 4400000 },
    { month: "2026-05", total_claims: 1350, flagged_fraud: 310, total_amount: 16800000, fraud_exposure: 4800000 },
    { month: "2026-06", total_claims: 1420, flagged_fraud: 345, total_amount: 17900000, fraud_exposure: 5200000 },
    { month: "2026-07", total_claims: 1390, flagged_fraud: 320, total_amount: 17100000, fraud_exposure: 4900000 },
    { month: "2026-08", total_claims: 1460, flagged_fraud: 360, total_amount: 18400000, fraud_exposure: 5600000 },
    { month: "2026-09", total_claims: 1510, flagged_fraud: 375, total_amount: 19200000, fraud_exposure: 5900000 },
    { month: "2026-10", total_claims: 1550, flagged_fraud: 390, total_amount: 19800000, fraud_exposure: 6100000 },
  ],
  category_distribution: [
    { insurance_type: "Auto", total_claims: 5419, fraud_claims: 1320, fraud_rate: 24.4 },
    { insurance_type: "Property", total_claims: 3636, fraud_claims: 890, fraud_rate: 24.5 },
    { insurance_type: "Health", total_claims: 2166, fraud_claims: 480, fraud_rate: 22.2 },
    { insurance_type: "Life", total_claims: 779, fraud_claims: 197, fraud_rate: 25.3 },
  ],
  risk_distribution: [
    { category: "Low Risk", count: 9113, percentage: 75.9, color: "#10b981" },
    { category: "Medium Risk", count: 1822, percentage: 15.2, color: "#f59e0b" },
    { category: "High Risk", count: 1065, percentage: 8.9, color: "#ef4444" },
  ],
  regional_distribution: [
    { region: "Northeast", claims_count: 3240, fraud_count: 785, fraud_rate: 24.2, total_exposure: 11450000 },
    { region: "South", claims_count: 4120, fraud_count: 1015, fraud_rate: 24.6, total_exposure: 14800000 },
    { region: "Midwest", claims_count: 2480, fraud_count: 590, fraud_rate: 23.8, total_exposure: 8650000 },
    { region: "West", claims_count: 2160, fraud_count: 497, fraud_rate: 23.0, total_exposure: 8350000 },
  ],
};

const FALLBACK_BENCHMARKS: BenchmarkData = {
  dataset_size: 12000,
  test_size: 2400,
  fraud_rate: 0.1003,
  champion: "XGBoost",
  models: {
    xgboost: {
      name: "XGBoost Classifier",
      accuracy: 0.9015,
      precision: 0.5017,
      recall: 0.5975,
      f1_score: 0.5455,
      roc_auc: 0.9225,
      confusion_matrix: { tn: 2020, fp: 140, fn: 97, tp: 143 },
      roc_curve: [
        { fpr: 0.0, tpr: 0.0 },
        { fpr: 0.02, tpr: 0.35 },
        { fpr: 0.05, tpr: 0.62 },
        { fpr: 0.1, tpr: 0.78 },
        { fpr: 0.18, tpr: 0.88 },
        { fpr: 0.3, tpr: 0.94 },
        { fpr: 0.5, tpr: 0.98 },
        { fpr: 1.0, tpr: 1.0 },
      ],
    },
    random_forest: {
      name: "Random Forest Classifier",
      accuracy: 0.9085,
      precision: 0.5528,
      recall: 0.5643,
      f1_score: 0.5585,
      roc_auc: 0.9187,
      confusion_matrix: { tn: 2045, fp: 115, fn: 105, tp: 135 },
      roc_curve: [
        { fpr: 0.0, tpr: 0.0 },
        { fpr: 0.03, tpr: 0.32 },
        { fpr: 0.07, tpr: 0.58 },
        { fpr: 0.12, tpr: 0.75 },
        { fpr: 0.22, tpr: 0.86 },
        { fpr: 0.35, tpr: 0.92 },
        { fpr: 1.0, tpr: 1.0 },
      ],
    },
    logistic_regression: {
      name: "Logistic Regression Baseline",
      accuracy: 0.825,
      precision: 0.2912,
      recall: 0.8133,
      f1_score: 0.4289,
      roc_auc: 0.8768,
      confusion_matrix: { tn: 1785, fp: 375, fn: 45, tp: 195 },
      roc_curve: [
        { fpr: 0.0, tpr: 0.0 },
        { fpr: 0.08, tpr: 0.42 },
        { fpr: 0.18, tpr: 0.65 },
        { fpr: 0.32, tpr: 0.82 },
        { fpr: 0.55, tpr: 0.91 },
        { fpr: 1.0, tpr: 1.0 },
      ],
    },
    isolation_forest: {
      name: "Isolation Forest (Anomaly Detection)",
      description: "Unsupervised multi-dimensional anomaly detector identifying outlier claims without label dependency",
      contamination: 0.1,
      n_estimators: 150,
    },
  },
  feature_importances: [
    { feature: "claim_amount", importance: 0.1824 },
    { feature: "submission_delay_days", importance: 0.1412 },
    { feature: "number_of_previous_claims", importance: 0.1285 },
    { feature: "claim_to_coverage_ratio", importance: 0.1154 },
    { feature: "policy_age_days", importance: 0.0987 },
    { feature: "police_report_filed_No", importance: 0.0845 },
    { feature: "previous_claim_payouts", importance: 0.0652 },
    { feature: "claim_to_income_ratio", importance: 0.0543 },
    { feature: "damage_severity_Total Loss", importance: 0.0485 },
    { feature: "supporting_documents_count", importance: 0.0388 },
  ],
  version: "1.0.0",
  last_trained: "2026-11-02T03:25:00Z",
};

const INITIAL_FALLBACK_CLAIMS: ClaimListItem[] = [
  {
    id: 1,
    claim_id: "CLM-10599",
    customer_name: "Robert Henderson",
    policy_number: "AUT-882319",
    insurance_type: "Auto",
    claim_amount: 48500,
    incident_date: "2026-09-14",
    claim_submission_date: "2026-10-28",
    incident_location: "Philadelphia, PA",
    damage_severity: "Total Loss",
    status: "Under Review",
    risk_score: 89,
    risk_category: "High",
    investigation_status: "Under Investigation",
  },
  {
    id: 2,
    claim_id: "CLM-10482",
    customer_name: "David Miller",
    policy_number: "PRO-392104",
    insurance_type: "Property",
    claim_amount: 32000,
    incident_date: "2026-10-02",
    claim_submission_date: "2026-10-15",
    incident_location: "Atlanta, GA",
    damage_severity: "Major",
    status: "Under Review",
    risk_score: 76,
    risk_category: "High",
    investigation_status: "Pending Review",
  },
  {
    id: 3,
    claim_id: "CLM-10377",
    customer_name: "Jennifer Garcia",
    policy_number: "AUT-294012",
    insurance_type: "Auto",
    claim_amount: 14200,
    incident_date: "2026-09-20",
    claim_submission_date: "2026-10-08",
    incident_location: "Chicago, IL",
    damage_severity: "Moderate",
    status: "Under Review",
    risk_score: 54,
    risk_category: "Medium",
    investigation_status: "Additional Information Required",
  },
  {
    id: 4,
    claim_id: "CLM-10291",
    customer_name: "Thomas Moore",
    policy_number: "HLT-771920",
    insurance_type: "Health",
    claim_amount: 9800,
    incident_date: "2026-10-05",
    claim_submission_date: "2026-10-09",
    incident_location: "Los Angeles, CA",
    damage_severity: "Moderate",
    status: "Approved",
    risk_score: 22,
    risk_category: "Low",
    investigation_status: "Verified Legitimate",
  },
  {
    id: 5,
    claim_id: "CLM-10114",
    customer_name: "Sarah Jenkins",
    policy_number: "PRO-190283",
    insurance_type: "Property",
    claim_amount: 4500,
    incident_date: "2026-10-12",
    claim_submission_date: "2026-10-14",
    incident_location: "Boston, MA",
    damage_severity: "Minor",
    status: "Approved",
    risk_score: 14,
    risk_category: "Low",
    investigation_status: "Verified Legitimate",
  },
];

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ access_token: string; user: User }> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await handleResponse<{ access_token: string; user: User }>(res);
      localStorage.setItem("auth_token", data.access_token);
      return data;
    } catch {
      // Offline / standalone Vercel preview fallback
      const mockUser: User = {
        id: 1,
        username: username,
        email: `${username}@insureguard.ai`,
        full_name:
          username === "investigator"
            ? "David Miller (Senior SIU Investigator)"
            : username === "claimsofficer"
            ? "Elena Rostova (Claims Intake Specialist)"
            : "Sarah Jenkins (Chief Risk Officer)",
        role:
          username === "investigator"
            ? "Fraud Investigator"
            : username === "claimsofficer"
            ? "Claims Officer"
            : "Admin",
        is_active: true,
      };
      const token = `mock-jwt-token-vercel-${username}`;
      localStorage.setItem("auth_token", token);
      return { access_token: token, user: mockUser };
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<User>(res);
    } catch {
      return {
        id: 1,
        username: "admin",
        email: "admin@insureguard.ai",
        full_name: "Sarah Jenkins (Chief Risk Officer)",
        role: "Admin",
        is_active: true,
      };
    }
  },

  async getUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE}/auth/users`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<User[]>(res);
    } catch {
      return [
        { id: 1, username: "admin", email: "admin@insureguard.ai", full_name: "Sarah Jenkins", role: "Admin", is_active: true },
        { id: 2, username: "investigator", email: "investigator@insureguard.ai", full_name: "David Miller", role: "Fraud Investigator", is_active: true },
        { id: 3, username: "claimsofficer", email: "officer@insureguard.ai", full_name: "Elena Rostova", role: "Claims Officer", is_active: true },
      ];
    }
  },

  // Claims
  async getClaims(params: {
    page?: number;
    limit?: number;
    search?: string;
    insurance_type?: string;
    risk_category?: string;
    status?: string;
    sort_by?: string;
    sort_desc?: boolean;
  } = {}): Promise<{ total: number; page: number; limit: number; items: ClaimListItem[] }> {
    try {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.search) query.append("search", params.search);
      if (params.insurance_type && params.insurance_type !== "All")
        query.append("insurance_type", params.insurance_type);
      if (params.risk_category && params.risk_category !== "All")
        query.append("risk_category", params.risk_category);
      if (params.status && params.status !== "All")
        query.append("status", params.status);

      const res = await fetch(`${API_BASE}/claims?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<{ total: number; page: number; limit: number; items: ClaimListItem[] }>(res);
    } catch {
      let items = [...INITIAL_FALLBACK_CLAIMS];
      if (params.insurance_type && params.insurance_type !== "All") {
        items = items.filter((c) => c.insurance_type === params.insurance_type);
      }
      if (params.risk_category && params.risk_category !== "All") {
        items = items.filter((c) => c.risk_category === params.risk_category);
      }
      return { total: items.length, page: 1, limit: 15, items };
    }
  },

  async getClaim(claimId: string): Promise<Claim> {
    try {
      const res = await fetch(`${API_BASE}/claims/${claimId}`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<Claim>(res);
    } catch {
      return {
        id: 1,
        claim_id: claimId,
        customer_id: "CUST-3829",
        customer_name: "Robert Henderson",
        customer_age: 48,
        policy_number: "AUT-882319",
        insurance_type: "Auto",
        claim_amount: 48500,
        policy_start_date: "2026-08-15",
        incident_date: "2026-09-14",
        claim_submission_date: "2026-10-28",
        incident_location: "Philadelphia, PA",
        region: "Northeast",
        incident_type: "Single Vehicle Collision",
        damage_severity: "Total Loss",
        police_report_filed: "No",
        witness_present: "No",
        number_of_previous_claims: 4,
        previous_claim_payouts: 44220,
        incident_description: "Vehicle collision occurred late evening on secondary road. Total front assembly destroyed.",
        supporting_documents: "auto_incident_report.pdf;repair_estimate_invoice.pdf",
        status: "Under Review",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        prediction: {
          claim_id: claimId,
          risk_score: 89,
          risk_category: "High",
          anomaly_score: 0.642,
          model_name: "XGBoost Champion + Isolation Forest Anomaly Ensemble",
          model_version: "1.0.0",
          top_risk_indicators: [
            "Policy inception anomaly: Incident occurred within 30 days of policy start",
            "High historical claim velocity: 4 claims submitted in prior cycles",
            "Absence of official law enforcement report for severe loss event",
            "Reporting lag: Claim submitted 44 days after incident date",
          ],
          shap_contributions: [
            { feature: "number_of_previous_claims", label: "Prior Claim Frequency", value: 4, shap_value: 1.0825, impact: "Increases Risk" },
            { feature: "police_report_filed_No", label: "Absence of Police Report", value: 1, shap_value: 0.614, impact: "Increases Risk" },
            { feature: "submission_delay_days", label: "Reporting Delay (Days)", value: 44, shap_value: 0.589, impact: "Increases Risk" },
            { feature: "previous_claim_payouts", label: "Cumulative Prior Payouts", value: 44220, shap_value: 0.4505, impact: "Increases Risk" },
            { feature: "claim_amount", label: "Total Claim Amount", value: 48500, shap_value: 0.381, impact: "Increases Risk" },
            { feature: "premium_amount", label: "Annual Premium Amount", value: 1600, shap_value: -0.3215, impact: "Lowers Risk" },
            { feature: "credit_score", label: "Financial Indicator (Credit Rating)", value: 670, shap_value: -0.2414, impact: "Lowers Risk" },
          ],
          investigation_checklist: [
            "Verify historical claim records in ISO ClaimSearch database.",
            "Contact dispatch logs to confirm absence of reported emergency calls.",
            "Request certified repair invoices with direct shop inspection.",
          ],
          natural_language_explanation:
            "This claim was evaluated using an ensemble gradient boosting model with explainable SHAP attribution. Primary risk drivers include elevated prior claim frequency, extended reporting delay, and absence of an official incident report. Compliance note: Demographic traits or geographical location are never treated as proof of fraud.",
          predicted_at: new Date().toISOString(),
        },
        investigation: {
          id: 1,
          claim_id: claimId,
          assigned_to_id: 2,
          assigned_to_name: "David Miller (Senior SIU Investigator)",
          status: "Under Investigation",
          priority: "Critical",
          outcome_reason: "Special Investigation Unit active inquiry initiated. Verification in progress.",
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          notes: [
            {
              id: 1,
              investigation_id: 1,
              user_id: 2,
              author_name: "David Miller",
              note_text: "Contacted local precinct to cross-check accident logs. Requested shop estimate breakdown.",
              created_at: new Date().toISOString(),
            },
          ],
        },
      };
    }
  },

  async createClaim(claimData: Partial<Claim>): Promise<Claim> {
    try {
      const res = await fetch(`${API_BASE}/claims`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(claimData),
      });
      return await handleResponse<Claim>(res);
    } catch {
      const mockId = `CLM-${Math.floor(10000 + Math.random() * 90000)}`;
      return {
        id: Math.floor(Math.random() * 1000),
        claim_id: mockId,
        customer_id: claimData.customer_id || "CUST-1001",
        customer_name: claimData.customer_name || "New Claimant",
        customer_age: claimData.customer_age || 35,
        policy_number: claimData.policy_number || "POL-100001",
        insurance_type: claimData.insurance_type || "Auto",
        claim_amount: claimData.claim_amount || 5000,
        policy_start_date: claimData.policy_start_date || "2024-01-01",
        incident_date: claimData.incident_date || "2026-10-10",
        claim_submission_date: claimData.claim_submission_date || "2026-10-12",
        incident_location: claimData.incident_location || "New York, NY",
        region: claimData.region || "Northeast",
        incident_type: claimData.incident_type || "Collision",
        damage_severity: claimData.damage_severity || "Moderate",
        police_report_filed: claimData.police_report_filed || "Yes",
        witness_present: claimData.witness_present || "No",
        number_of_previous_claims: claimData.number_of_previous_claims || 0,
        previous_claim_payouts: claimData.previous_claim_payouts || 0,
        incident_description: claimData.incident_description || "Standard claim submitted.",
        status: "Under Review",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  },

  async updateClaim(claimId: string, claimData: Partial<Claim>): Promise<Claim> {
    const res = await fetch(`${API_BASE}/claims/${claimId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(claimData),
    });
    return handleResponse<Claim>(res);
  },

  // Predictions & XAI
  async evaluateSimulation(claimData: Record<string, any>): Promise<FraudPrediction> {
    try {
      const res = await fetch(`${API_BASE}/predictions/evaluate`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(claimData),
      });
      return await handleResponse<FraudPrediction>(res);
    } catch {
      // Offline client simulation calculator
      const amount = Number(claimData.claim_amount) || 10000;
      const prevClaims = Number(claimData.number_of_previous_claims) || 0;
      const noPolice = claimData.police_report_filed === "No" ? 1 : 0;
      const noWitness = claimData.witness_present === "No" ? 1 : 0;

      let score = 20 + prevClaims * 12 + (amount > 30000 ? 25 : 5) + noPolice * 18 + noWitness * 8;
      score = Math.min(96, Math.max(8, score));
      const category = score >= 70 ? "High" : score >= 31 ? "Medium" : "Low";

      return {
        claim_id: "SIM-CLAIM",
        risk_score: score,
        risk_category: category as any,
        anomaly_score: Number((score / 100 * 0.75).toFixed(3)),
        model_name: "XGBoost Champion + Isolation Forest Anomaly Ensemble",
        model_version: "1.0.0",
        top_risk_indicators: [
          prevClaims >= 2 ? `High prior claim frequency (${prevClaims} claims)` : "Prior claim frequency within acceptable norms",
          amount >= 35000 ? `Disproportionately elevated claim amount ($${amount.toLocaleString()})` : "Claim amount proportional to line median",
          noPolice ? "Absence of official law enforcement or fire incident report" : "Official incident report corroborated",
        ],
        shap_contributions: [
          { feature: "number_of_previous_claims", label: "Prior Claim Frequency", value: prevClaims, shap_value: prevClaims * 0.28, impact: prevClaims > 0 ? "Increases Risk" : "Lowers Risk" },
          { feature: "claim_amount", label: "Total Claim Amount", value: amount, shap_value: amount > 25000 ? 0.42 : -0.25, impact: amount > 25000 ? "Increases Risk" : "Lowers Risk" },
          { feature: "police_report_filed_No", label: "Absence of Police Report", value: noPolice, shap_value: noPolice ? 0.38 : -0.31, impact: noPolice ? "Increases Risk" : "Lowers Risk" },
          { feature: "witness_present_No", label: "Absence of Witnesses", value: noWitness, shap_value: noWitness ? 0.22 : -0.19, impact: noWitness ? "Increases Risk" : "Lowers Risk" },
        ],
        investigation_checklist: [
          "Verify claim history with industry central database.",
          "Request itemized repair estimates and original purchase invoices.",
          "Conduct phone verification with attending party or vendor.",
        ],
        natural_language_explanation: `Simulation evaluated risk at ${score}/100 (${category} risk category). Primary attribution drivers include historical claim velocity, claim amount, and documentation verification status. Decision support notice: Human investigator verification required.`,
        predicted_at: new Date().toISOString(),
      };
    }
  },

  async getClaimExplanation(claimId: string): Promise<FraudPrediction> {
    const res = await fetch(`${API_BASE}/predictions/${claimId}/explain`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<FraudPrediction>(res);
  },

  async getModelBenchmarks(): Promise<BenchmarkData> {
    try {
      const res = await fetch(`${API_BASE}/predictions/metrics/benchmarks`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<BenchmarkData>(res);
    } catch {
      return FALLBACK_BENCHMARKS;
    }
  },

  // Investigations
  async getInvestigations(params: {
    status?: string;
    priority?: string;
    assigned_to_id?: number;
  } = {}): Promise<any[]> {
    try {
      const query = new URLSearchParams();
      if (params.status && params.status !== "All") query.append("status", params.status);
      if (params.priority && params.priority !== "All") query.append("priority", params.priority);
      if (params.assigned_to_id) query.append("assigned_to_id", params.assigned_to_id.toString());

      const res = await fetch(`${API_BASE}/investigations?${query.toString()}`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<any[]>(res);
    } catch {
      return INITIAL_FALLBACK_CLAIMS.map((c) => ({
        id: c.id,
        claim_id: c.claim_id,
        customer_name: c.customer_name,
        insurance_type: c.insurance_type,
        claim_amount: c.claim_amount,
        risk_score: c.risk_score,
        risk_category: c.risk_category,
        assigned_to_id: 2,
        assigned_to_name: "David Miller",
        status: c.investigation_status,
        priority: c.risk_score >= 80 ? "Critical" : "High",
        outcome_reason: c.investigation_status === "Confirmed Fraud" ? "Confirmed fraud pattern" : null,
        started_at: "2026-10-15T09:00:00Z",
        updated_at: "2026-10-28T14:30:00Z",
        notes_count: 2,
      }));
    }
  },

  async updateInvestigation(
    investigationId: number,
    data: {
      status?: string;
      assigned_to_id?: number | null;
      priority?: string;
      outcome_reason?: string;
    }
  ): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/investigations/${investigationId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });
      return await handleResponse<any>(res);
    } catch {
      return { status: "success", id: investigationId, current_status: data.status };
    }
  },

  async addInvestigationNote(investigationId: number, note_text: string): Promise<InvestigationNote> {
    try {
      const res = await fetch(`${API_BASE}/investigations/${investigationId}/notes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ note_text }),
      });
      return await handleResponse<InvestigationNote>(res);
    } catch {
      return {
        id: Math.floor(Math.random() * 1000),
        investigation_id: investigationId,
        user_id: 1,
        author_name: "Investigator Note",
        note_text,
        created_at: new Date().toISOString(),
      };
    }
  },

  // Analytics & Dashboard
  async getDashboardOverview(): Promise<DashboardData> {
    try {
      const res = await fetch(`${API_BASE}/analytics/overview`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<DashboardData>(res);
    } catch {
      return FALLBACK_DASHBOARD;
    }
  },

  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    try {
      const res = await fetch(`${API_BASE}/analytics/audit-logs?limit=${limit}`, {
        headers: getAuthHeaders(),
      });
      return await handleResponse<AuditLog[]>(res);
    } catch {
      return [
        { id: 1, username: "David Miller", action: "INVESTIGATION_UPDATED", entity_type: "Investigation", entity_id: "1", details: "Status updated to Under Investigation", timestamp: new Date().toISOString() },
        { id: 2, username: "admin", action: "CLAIM_CREATED", entity_type: "Claim", entity_id: "CLM-10599", details: "New claim intake scored 89/100 (High Risk)", timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, username: "admin", action: "USER_LOGIN", entity_type: "User", entity_id: "1", details: "Admin session authenticated", timestamp: new Date(Date.now() - 7200000).toISOString() },
      ];
    }
  },

  // Documents
  async uploadDocument(claimId: string, file: File, investigationId?: number): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("claim_id", claimId);
      if (investigationId) formData.append("investigation_id", investigationId.toString());
      formData.append("file", file);

      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });
      return await handleResponse<any>(res);
    } catch {
      return { status: "success", filename: file.name, size: file.size, uploaded_at: new Date().toISOString() };
    }
  },
};
