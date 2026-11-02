import React, { useState, useEffect } from "react";
import {
  X,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Send,
  Upload,
  Info,
  CheckSquare,
  Square,
  Lock,
} from "lucide-react";
import { Claim, InvestigationStatus, UserRole } from "../types";
import { ShapWaterfallChart } from "./ShapWaterfallChart";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface ClaimDetailModalProps {
  claimId: string | null;
  onClose: () => void;
  onClaimUpdated?: () => void;
}

export const ClaimDetailModal: React.FC<ClaimDetailModalProps> = ({
  claimId,
  onClose,
  onClaimUpdated,
}) => {
  const { role, user } = useAuth();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Investigation form states
  const [newStatus, setNewStatus] = useState<InvestigationStatus>("Pending Review");
  const [outcomeReason, setOutcomeReason] = useState<string>("");
  const [noteText, setNoteText] = useState<string>("");
  const [submittingNote, setSubmittingNote] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!claimId) return;
    setLoading(true);
    setError(null);
    api
      .getClaim(claimId)
      .then((data) => {
        setClaim(data);
        if (data.investigation) {
          setNewStatus(data.investigation.status);
          setOutcomeReason(data.investigation.outcome_reason || "");
        }
      })
      .catch((err) => {
        setError(err.message || "Failed to load claim details");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [claimId]);

  if (!claimId) return null;

  const handleStatusUpdate = async () => {
    if (!claim?.investigation) return;
    setUpdatingStatus(true);
    try {
      await api.updateInvestigation(claim.investigation.id, {
        status: newStatus,
        outcome_reason: outcomeReason,
      });
      // Refresh claim
      const refreshed = await api.getClaim(claimId);
      setClaim(refreshed);
      if (onClaimUpdated) onClaimUpdated();
    } catch (e: any) {
      alert(`Error updating investigation: ${e.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim?.investigation || !noteText.trim()) return;
    setSubmittingNote(true);
    try {
      const added = await api.addInvestigationNote(claim.investigation.id, noteText.trim());
      setClaim({
        ...claim,
        investigation: {
          ...claim.investigation,
          notes: [...(claim.investigation.notes || []), added],
        },
      });
      setNoteText("");
    } catch (e: any) {
      alert(`Error adding note: ${e.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !claim) return;
    setUploadingDoc(true);
    try {
      await api.uploadDocument(claim.claim_id, file, claim.investigation?.id);
      alert(`Document ${file.name} uploaded and attached to audit record.`);
      // Refresh
      const refreshed = await api.getClaim(claimId);
      setClaim(refreshed);
    } catch (e: any) {
      alert(`Upload error: ${e.message}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  const pred = claim?.prediction;
  const inv = claim?.investigation;
  const isHighRisk = pred?.risk_category === "High";
  const isMediumRisk = pred?.risk_category === "Medium";

  // Check if role has investigator rights
  const canModifyOutcome = role === "Admin" || role === "Fraud Investigator";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl border border-slate-800 bg-[#0c1220] text-slate-100 shadow-2xl shadow-black my-8 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                isHighRisk
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : isMediumRisk
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {pred?.risk_score ?? "--"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {claim?.claim_id || "Loading..."}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    isHighRisk
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : isMediumRisk
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {pred?.risk_category || "Evaluating"} Risk
                </span>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300">
                  Status: {inv?.status || claim?.status}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Policy #{claim?.policy_number} | Insured: {claim?.customer_name} ({claim?.customer_id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-xs text-slate-400">Loading claim telemetry and SHAP explanations...</p>
            </div>
          </div>
        ) : error || !claim ? (
          <div className="p-8 text-center text-red-400 text-sm">
            {error || "Claim details unavailable."}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Regulatory Notice Banner */}
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs text-blue-300 flex items-start gap-3">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Investigator Decision Support Rule:</strong> AI predictions evaluate behavioral anomalies,
                velocity, and timing patterns to support human investigators. Claims must never be automatically rejected
                solely on machine predictions. Only authorized SIU personnel can record final outcomes.
              </div>
            </div>

            {/* Grid 1: Claim Overview Fields */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Claim Amount</p>
                <p className="text-xl font-bold text-white mt-1">
                  ${claim.claim_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">Type: {claim.insurance_type}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Incident Date</p>
                <p className="text-sm font-semibold text-white mt-1">{claim.incident_date}</p>
                <p className="text-[11px] text-slate-400 mt-1">Submitted: {claim.claim_submission_date}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Damage Severity</p>
                <p className="text-sm font-semibold text-white mt-1">{claim.damage_severity}</p>
                <p className="text-[11px] text-slate-400 mt-1">Police Report: {claim.police_report_filed}</p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5">
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Prior Claim History</p>
                <p className="text-sm font-semibold text-white mt-1">
                  {claim.number_of_previous_claims} Prior Claims
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Paid: ${claim.previous_claim_payouts?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Narrative Description & Location */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">
                Incident Narrative & Supporting Context
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">{claim.incident_description}</p>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    Location: <strong>{claim.incident_location}</strong> ({claim.region})
                  </span>
                </div>
                <div>
                  Witness Present: <strong>{claim.witness_present}</strong>
                </div>
                <div>
                  Policy Inception: <strong>{claim.policy_start_date}</strong>
                </div>
                {claim.supporting_documents && (
                  <div>
                    Attached Docs: <strong>{claim.supporting_documents.split(";").join(", ")}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Section: Explainable AI Deep Dive */}
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Explainable AI (SHAP) Fraud Rationale
                  </h3>
                </div>
                <span className="text-[11px] text-indigo-300 font-mono">
                  Engine: {pred?.model_name || "XGBoost Champion"}
                </span>
              </div>

              {/* Top Risk Indicators */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-300 mb-2">Primary Suspicion Indicators:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {pred?.top_risk_indicators?.map((indicator, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-950/20 p-2.5 text-xs text-red-300"
                    >
                      <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{indicator}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Natural Language Explanation */}
              <div className="rounded-lg bg-slate-900/80 p-3.5 border border-slate-800 mb-5">
                <p className="text-xs text-slate-300 leading-relaxed">
                  {pred?.natural_language_explanation}
                </p>
              </div>

              {/* SHAP Waterfall Feature Contributions */}
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-2">
                  Feature Attribution Impact (SHAP Values):
                </p>
                <ShapWaterfallChart contributions={pred?.shap_contributions || []} />
              </div>

              {/* Human Investigator Verification Checklist */}
              {pred?.investigation_checklist && pred.investigation_checklist.length > 0 && (
                <div className="mt-5 border-t border-slate-800/80 pt-4">
                  <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wide mb-2.5">
                    Actionable Verification Protocol:
                  </p>
                  <div className="space-y-2">
                    {pred.investigation_checklist.map((item, idx) => {
                      const isChecked = !!checkedItems[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => setCheckedItems({ ...checkedItems, [idx]: !isChecked })}
                          className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs cursor-pointer transition ${
                            isChecked
                              ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
                              : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                          )}
                          <span className={isChecked ? "line-through opacity-80" : ""}>{item}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Section: Fraud Investigation Management Workspace */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white">Investigation Determination & Evidence</h3>
                <span className="text-xs text-slate-400">
                  Assigned Investigator: <strong>{inv?.assigned_to_name || "Unassigned"}</strong>
                </span>
              </div>

              {/* Status Update & Outcome Form */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4 mb-5">
                <p className="text-xs font-semibold text-slate-300 mb-3">Record Investigation Outcome</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Investigation Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as InvestigationStatus)}
                      disabled={!canModifyOutcome}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-60"
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
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Final Outcome Rationale (Mandatory for closure)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Invoices verified with repair shop, no fraud detected."
                      value={outcomeReason}
                      onChange={(e) => setOutcomeReason(e.target.value)}
                      disabled={!canModifyOutcome}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {!canModifyOutcome && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400">
                      <Lock className="h-3.5 w-3.5" />
                      <span>Switch to Fraud Investigator or Admin role to record outcomes.</span>
                    </div>
                  )}
                  {canModifyOutcome && (
                    <button
                      onClick={handleStatusUpdate}
                      disabled={updatingStatus}
                      className="ml-auto rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60"
                    >
                      {updatingStatus ? "Saving..." : "Update Investigation Record"}
                    </button>
                  )}
                </div>
              </div>

              {/* Investigator Notes Timeline */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-slate-300 mb-2">Investigator Notes Log:</p>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {inv?.notes && inv.notes.length > 0 ? (
                    inv.notes.map((n) => (
                      <div key={n.id} className="rounded-lg bg-slate-800/60 p-3 text-xs border border-slate-800">
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span className="font-semibold text-indigo-400">{n.author_name}</span>
                          <span>{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-200">{n.note_text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No notes recorded yet.</p>
                  )}
                </div>

                {/* Add Note Input */}
                <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an investigative observation, phone log, or finding..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !noteText.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Post</span>
                  </button>
                </form>
              </div>

              {/* Upload Supporting Evidence Document */}
              <div className="border-t border-slate-800 pt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-300">Attach Evidence Document</p>
                  <p className="text-[11px] text-slate-400">PDF, PNG, JPG, or ZIP up to 15MB</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition">
                  <Upload className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{uploadingDoc ? "Uploading..." : "Upload Document"}</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadingDoc}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
