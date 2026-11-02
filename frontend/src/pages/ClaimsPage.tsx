import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Download,
} from "lucide-react";
import { ClaimListItem, Claim } from "../types";
import { api } from "../services/api";
import { NewClaimModal } from "../components/NewClaimModal";

interface ClaimsPageProps {
  onSelectClaim: (claimId: string) => void;
  initialSearch?: string;
}

export const ClaimsPage: React.FC<ClaimsPageProps> = ({
  onSelectClaim,
  initialSearch = "",
}) => {
  const [claims, setClaims] = useState<ClaimListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(15);
  const [search, setSearch] = useState<string>(initialSearch);
  const [insuranceType, setInsuranceType] = useState<string>("All");
  const [riskCategory, setRiskCategory] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.getClaims({
        page,
        limit,
        search: search.trim() || undefined,
        insurance_type: insuranceType,
        risk_category: riskCategory,
        status: status,
      });
      setClaims(res.items);
      setTotal(res.total);
    } catch (e) {
      console.error("Fetch claims error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [page, insuranceType, riskCategory, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchClaims();
  };

  const handleClaimCreated = (newClaim: Claim) => {
    fetchClaims();
    onSelectClaim(newClaim.claim_id);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-5 pb-12">
      {/* Title & Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Insurance Claim Management</h1>
          <p className="text-xs text-slate-400">
            Intake, filter, and review claims with ML fraud scoring and audit history
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Claim Intake</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400 top-2.5" />
            <input
              type="text"
              placeholder="Search Claim ID, Customer, Policy #, or City..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500"
            />
          </div>

          {/* Insurance Line Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Line:</span>
            <select
              value={insuranceType}
              onChange={(e) => {
                setInsuranceType(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="All">All Lines</option>
              <option value="Auto">Auto</option>
              <option value="Property">Property</option>
              <option value="Health">Health</option>
              <option value="Life">Life</option>
            </select>
          </div>

          {/* Risk Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Risk:</span>
            <select
              value={riskCategory}
              onChange={(e) => {
                setRiskCategory(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="All">All Risk Levels</option>
              <option value="High">High Risk (≥ 70)</option>
              <option value="Medium">Medium Risk (31–69)</option>
              <option value="Low">Low Risk (≤ 30)</option>
            </select>
          </div>

          {/* SIU Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Additional Information Required">Additional Info Req.</option>
              <option value="Verified Legitimate">Verified Legitimate</option>
              <option value="Confirmed Fraud">Confirmed Fraud</option>
              <option value="Inconclusive">Inconclusive</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Claims Data Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Customer & Policy</th>
                <th className="py-3 px-4">Insurance Type</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Incident / Submission</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Fraud Risk Score</th>
                <th className="py-3 px-4">Investigation Status</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span>Fetching claim records...</span>
                    </div>
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No insurance claims matched the specified criteria.
                  </td>
                </tr>
              ) : (
                claims.map((claim) => {
                  const isHigh = claim.risk_category === "High";
                  const isMed = claim.risk_category === "Medium";
                  return (
                    <tr
                      key={claim.id}
                      onClick={() => onSelectClaim(claim.claim_id)}
                      className="cursor-pointer hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-white group-hover:text-indigo-400 transition">
                        {claim.claim_id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{claim.customer_name}</div>
                        <div className="text-[11px] text-slate-500">Policy: {claim.policy_number}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                          {claim.insurance_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-white font-mono">
                        ${claim.claim_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <div>{claim.incident_date}</div>
                        <div className="text-[11px] text-slate-500">Sub: {claim.claim_submission_date}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{claim.incident_location}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            isHigh
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : isMed
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          {isHigh ? (
                            <ShieldAlert className="h-3 w-3" />
                          ) : isMed ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : (
                            <ShieldCheck className="h-3 w-3" />
                          )}
                          <span>{claim.risk_score}/100</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            claim.investigation_status === "Confirmed Fraud"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : claim.investigation_status === "Verified Legitimate"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {claim.investigation_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectClaim(claim.claim_id);
                          }}
                          className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-indigo-600 hover:text-white transition"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
          <div>
            Showing <strong>{(page - 1) * limit + 1}</strong> to{" "}
            <strong>{Math.min(page * limit, total)}</strong> of <strong>{total}</strong> claims
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>
            <span className="px-2 text-slate-400">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* New Claim Modal */}
      <NewClaimModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onClaimCreated={handleClaimCreated}
      />
    </div>
  );
};
