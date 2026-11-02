import {
  Claim,
  ClaimListItem,
  DashboardData,
  BenchmarkData,
  Investigation,
  InvestigationNote,
  AuditLog,
  User,
  FraudPrediction,
} from "../types";

const API_BASE = "/api";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

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
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse<{ access_token: string; user: User }>(res);
    localStorage.setItem("auth_token", data.access_token);
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User[]>(res);
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
    return handleResponse<{ total: number; page: number; limit: number; items: ClaimListItem[] }>(res);
  },

  async getClaim(claimId: string): Promise<Claim> {
    const res = await fetch(`${API_BASE}/claims/${claimId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Claim>(res);
  },

  async createClaim(claimData: Partial<Claim>): Promise<Claim> {
    const res = await fetch(`${API_BASE}/claims`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(claimData),
    });
    return handleResponse<Claim>(res);
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
    const res = await fetch(`${API_BASE}/predictions/evaluate`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(claimData),
    });
    return handleResponse<FraudPrediction>(res);
  },

  async getClaimExplanation(claimId: string): Promise<FraudPrediction> {
    const res = await fetch(`${API_BASE}/predictions/${claimId}/explain`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<FraudPrediction>(res);
  },

  async getModelBenchmarks(): Promise<BenchmarkData> {
    const res = await fetch(`${API_BASE}/predictions/metrics/benchmarks`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<BenchmarkData>(res);
  },

  // Investigations
  async getInvestigations(params: {
    status?: string;
    priority?: string;
    assigned_to_id?: number;
  } = {}): Promise<any[]> {
    const query = new URLSearchParams();
    if (params.status && params.status !== "All") query.append("status", params.status);
    if (params.priority && params.priority !== "All") query.append("priority", params.priority);
    if (params.assigned_to_id) query.append("assigned_to_id", params.assigned_to_id.toString());

    const res = await fetch(`${API_BASE}/investigations?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
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
    const res = await fetch(`${API_BASE}/investigations/${investigationId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async addInvestigationNote(investigationId: number, note_text: string): Promise<InvestigationNote> {
    const res = await fetch(`${API_BASE}/investigations/${investigationId}/notes`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ note_text }),
    });
    return handleResponse<InvestigationNote>(res);
  },

  // Analytics & Dashboard
  async getDashboardOverview(): Promise<DashboardData> {
    const res = await fetch(`${API_BASE}/analytics/overview`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DashboardData>(res);
  },

  async getAuditLogs(limit = 50): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/analytics/audit-logs?limit=${limit}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AuditLog[]>(res);
  },

  // Documents
  async uploadDocument(claimId: string, file: File, investigationId?: number): Promise<any> {
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
    return handleResponse<any>(res);
  },
};
