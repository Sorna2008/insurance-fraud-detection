import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  FileCheck2,
  PieChart as PieIcon,
  MapPin,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DashboardData, ClaimListItem } from "../types";
import { api } from "../services/api";

interface DashboardPageProps {
  onSelectClaim: (claimId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onSelectClaim,
  onNavigateTab,
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentFlagged, setRecentFlagged] = useState<ClaimListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [overviewRes, claimsRes] = await Promise.all([
        api.getDashboardOverview(),
        api.getClaims({ limit: 6, risk_category: "High" }),
      ]);
      setData(overviewRes);
      setRecentFlagged(claimsRes.items);
    } catch (e) {
      console.error("Dashboard data load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading || !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading fraud detection analytics & telemetry...</p>
        </div>
      </div>
    );
  }

  const { kpis, monthly_trends, category_distribution, risk_distribution, regional_distribution } = data;

  const RISK_COLORS = {
    "Low Risk": "#10b981",
    "Medium Risk": "#f59e0b",
    "High Risk": "#ef4444",
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Fraud Analytics Overview</h1>
          <p className="text-xs text-slate-400">
            Real-time telemetry, risk distributions, and machine learning fraud exposure estimates
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            <span>Refresh Telemetry</span>
          </button>
          <button
            onClick={() => onNavigateTab("explainable-ai")}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
          >
            <span>Open XAI Simulator</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 8 Primary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Claims */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Claims</span>
            <FileCheck2 className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{kpis.total_claims.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1">Processed across all lines</p>
        </div>

        {/* Legitimate Claims */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Legitimate</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{kpis.legitimate_claims.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {((kpis.legitimate_claims / Math.max(kpis.total_claims, 1)) * 100).toFixed(1)}% of total volume
          </p>
        </div>

        {/* Suspicious Claims */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Suspicious (Med)</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{kpis.suspicious_claims.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1">Score: 31–69 / 100</p>
        </div>

        {/* High-Risk Claims */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">High Risk</span>
            <ShieldAlert className="h-4 w-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-red-400 mt-2">{kpis.high_risk_claims.toLocaleString()}</p>
          <p className="text-[11px] text-slate-500 mt-1">Score: 70–100 / 100</p>
        </div>

        {/* Fraud Risk Percentage */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Fraud Exposure %</span>
            <TrendingUp className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-400 mt-2">{kpis.fraud_risk_percentage}%</p>
          <p className="text-[11px] text-slate-500 mt-1">High + Medium flag rate</p>
        </div>

        {/* Total Claim Amount */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Claim Exposure</span>
            <DollarSign className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-xl font-bold text-white mt-2">
            ${(kpis.total_claim_amount / 1_000_000).toFixed(2)}M
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Total claimed value</p>
        </div>

        {/* Estimated Fraud Exposure */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Potential Fraud Loss</span>
            <DollarSign className="h-4 w-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-amber-400 mt-2">
            ${(kpis.estimated_potential_fraud_exposure / 1_000_000).toFixed(2)}M
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Under SIU review</p>
        </div>

        {/* Pending Investigations */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:border-slate-700">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Inquiries</span>
            <ShieldAlert className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-indigo-400 mt-2">{kpis.pending_investigations}</p>
          <p className="text-[11px] text-slate-500 mt-1">Assigned to SIU team</p>
        </div>
      </div>

      {/* Row 1: Charts (Monthly Trend & Category Breakdown) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Claim & Fraud Trends */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Monthly Claim & Fraud Trends</h3>
              <p className="text-xs text-slate-400">Comparison of total claims intake vs flagged suspicious claims</p>
            </div>
            <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">Trailing 8 Mo</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="fraudColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                <Area
                  type="monotone"
                  dataKey="total_claims"
                  name="Total Intake"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#totalColor)"
                />
                <Area
                  type="monotone"
                  dataKey="flagged_fraud"
                  name="Flagged High/Med"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#fraudColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Category Distribution Donut */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Risk Category Breakdown</h3>
            <p className="text-xs text-slate-400">Classified claims by risk profile threshold</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={risk_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {risk_distribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        RISK_COLORS[entry.category as keyof typeof RISK_COLORS] || "#6366f1"
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3">
            {risk_distribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        RISK_COLORS[item.category as keyof typeof RISK_COLORS] || "#6366f1",
                    }}
                  />
                  <span className="text-slate-300">{item.category}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-400">{item.count}</span>
                  <span className="font-semibold text-white">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 2: Insurance Type Breakdown & Regional Exposure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fraud Rate by Insurance Line */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Fraud Rate by Insurance Line</h3>
              <p className="text-xs text-slate-400">Suspicion percentage per policy line</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={category_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="insurance_type" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="fraud_rate" name="Fraud Rate %" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Exposure Grid */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Regional Fraud Exposure</h3>
              <p className="text-xs text-slate-400">Geographic concentration and estimated potential exposure</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            {regional_distribution.map((reg, idx) => (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold text-white mb-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{reg.region} Region</span>
                  </div>
                  <span className="text-amber-400">{reg.fraud_rate}%</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span>Claims: {reg.claims_count}</span>
                  <span>Flagged: {reg.fraud_count}</span>
                </div>
                <div className="mt-2 text-xs font-medium text-slate-200">
                  Exposure: ${reg.total_exposure.toLocaleString()}
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-amber-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, reg.fraud_rate * 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Live Flagged Claims Ticker */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">High-Risk Claim Alerts Requiring Investigation</h3>
            <p className="text-xs text-slate-400">Claims with risk score ≥ 70/100 awaiting or under SIU review</p>
          </div>
          <button
            onClick={() => onNavigateTab("claims")}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All Claims</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Claim ID</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Risk Score</th>
                <th className="py-2.5 px-3">SIU Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentFlagged.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-mono font-bold text-white">{item.claim_id}</td>
                  <td className="py-3 px-3">{item.customer_name}</td>
                  <td className="py-3 px-3">{item.insurance_type}</td>
                  <td className="py-3 px-3 font-semibold text-white">
                    ${item.claim_amount?.toLocaleString()}
                  </td>
                  <td className="py-3 px-3">
                    <span className="rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[11px] font-bold text-red-400">
                      {item.risk_score}/100
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                      {item.investigation_status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectClaim(item.claim_id)}
                      className="rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
                    >
                      Investigate & Explain
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
