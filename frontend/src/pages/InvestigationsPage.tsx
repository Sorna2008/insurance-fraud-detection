import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  UserPlus,
  Send,
  Upload,
} from "lucide-react";
import { Investigation, InvestigationStatus, User as UserType } from "../types";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface InvestigationsPageProps {
  onSelectClaim: (claimId: string) => void;
}

export const InvestigationsPage: React.FC<InvestigationsPageProps> = ({
  onSelectClaim,
}) => {
  const { role, user } = useAuth();
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [investigators, setInvestigators] = useState<UserType[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);

  // Quick action modal / state
  const [selectedInv, setSelectedInv] = useState<any | null>(null);
  const [outcomeReason, setOutcomeReason] = useState<string>("");
  const [newStatus, setNewStatus] = useState<InvestigationStatus>("Under Investigation");
  const [assignedToId, setAssignedToId] = useState<number | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  const fetchInvestigations = async () => {
    setLoading(true);
    try {
      const [invRes, usersRes] = await Promise.all([
        api.getInvestigations({
          status: statusFilter !== "All" ? statusFilter : undefined,
          priority: priorityFilter !== "All" ? priorityFilter : undefined,
        }),
        api.getUsers().catch(() => []),
      ]);
      setInvestigations(invRes);
      setInvestigators(usersRes);
    } catch (e) {
      console.error("Fetch investigations error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestigations();
  }, [statusFilter, priorityFilter]);

  const handleUpdateInvestigation = async () => {
    if (!selectedInv) return;
    setUpdating(true);
    try {
      await api.updateInvestigation(selectedInv.id, {
        status: newStatus,
        outcome_reason: outcomeReason,
        assigned_to_id: assignedToId,
      });
      setSelectedInv(null);
      fetchInvestigations();
    } catch (e: any) {
      alert(`Error updating investigation: ${e.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const canRecordOutcome = role === "Admin" || role === "Fraud Investigator";

  const STATUS_TABS = [
    "All",
    "Pending Review",
    "Under Investigation",
    "Additional Information Required",
    "Verified Legitimate",
    "Confirmed Fraud",
    "Inconclusive",
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-red-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Special Investigation Unit (SIU) Workspace
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Active fraud investigations, investigator assignments, evidence collection, and final determination logs
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex overflow-x-auto gap-1 border-b border-slate-800 pb-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition ${
              statusFilter === tab
                ? "bg-indigo-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Investigations Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Claim ID</th>
                <th className="py-3 px-4">Insured Customer</th>
                <th className="py-3 px-4">Claim Amount</th>
                <th className="py-3 px-4">Risk Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned Investigator</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Notes</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span>Loading SIU investigation queue...</span>
                    </div>
                  </td>
                </tr>
              ) : investigations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No investigations match current filter criteria.
                  </td>
                </tr>
              ) : (
                investigations.map((inv) => {
                  const isHigh = inv.risk_category === "High";
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                      <td
                        onClick={() => onSelectClaim(inv.claim_id)}
                        className="py-3 px-4 font-mono font-bold text-white hover:text-indigo-400 cursor-pointer"
                      >
                        {inv.claim_id}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {inv.customer_name}
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-white">
                        ${inv.claim_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            isHigh
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {inv.risk_score}/100 ({inv.risk_category})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            inv.priority === "Critical"
                              ? "bg-red-950 text-red-400 border border-red-800"
                              : inv.priority === "High"
                              ? "bg-rose-950 text-rose-300 border border-rose-800"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {inv.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-slate-300">
                            {inv.assigned_to_name || "Unassigned"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            inv.status === "Confirmed Fraud"
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : inv.status === "Verified Legitimate"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : inv.status === "Under Investigation"
                              ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {inv.notes_count} entries
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedInv(inv);
                            setNewStatus(inv.status);
                            setOutcomeReason(inv.outcome_reason || "");
                            setAssignedToId(inv.assigned_to_id);
                          }}
                          className="rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-300 hover:bg-indigo-600 hover:text-white transition"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => onSelectClaim(inv.claim_id)}
                          className="rounded-lg bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700 transition"
                        >
                          Inspect SHAP
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Action Modal for Selected Investigation */}
      {selectedInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0c1220] p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Manage Investigation: {selectedInv.claim_id}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Insured: {selectedInv.customer_name} | Risk Score: {selectedInv.risk_score}/100
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Investigation Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as InvestigationStatus)}
                  disabled={!canRecordOutcome}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-indigo-500 disabled:opacity-60"
                >
                  <option value="Pending Review">Pending Review</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Additional Information Required">Additional Information Required</option>
                  <option value="Verified Legitimate">Verified Legitimate</option>
                  <option value="Confirmed Fraud">Confirmed Fraud</option>
                  <option value="Inconclusive">Inconclusive</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assign To Investigator</label>
                <select
                  value={assignedToId || ""}
                  onChange={(e) => setAssignedToId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none focus:border-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {investigators.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Outcome Rationale / Findings</label>
                <textarea
                  rows={3}
                  value={outcomeReason}
                  onChange={(e) => setOutcomeReason(e.target.value)}
                  placeholder="Mandatory findings explanation for audit log..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedInv(null)}
                  className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpdateInvestigation}
                  disabled={updating}
                  className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60"
                >
                  {updating ? "Saving..." : "Save Determination"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
