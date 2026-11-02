import React, { useState } from "react";
import { X, Sparkles, AlertCircle, FilePlus, ShieldCheck } from "lucide-react";
import { Claim } from "../types";
import { api } from "../services/api";

interface NewClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimCreated: (claim: Claim) => void;
}

export const NewClaimModal: React.FC<NewClaimModalProps> = ({
  isOpen,
  onClose,
  onClaimCreated,
}) => {
  const [formData, setFormData] = useState({
    customer_id: "CUST-3829",
    customer_name: "Robert Henderson",
    customer_age: 48,
    policy_number: "AUT-882319",
    insurance_type: "Auto",
    claim_amount: 18500,
    policy_start_date: "2024-03-10",
    incident_date: "2026-10-14",
    claim_submission_date: "2026-10-18",
    incident_location: "Chicago, IL",
    region: "Midwest",
    incident_type: "Multi-Vehicle Collision",
    damage_severity: "Major",
    police_report_filed: "Yes",
    witness_present: "Yes",
    number_of_previous_claims: 1,
    previous_claim_payouts: 4200,
    incident_description:
      "Vehicle rear-ended at intersection in moderate traffic conditions. Front bumper, headlights, and radiator sustained severe impact damages.",
    supporting_documents: "police_report.pdf;repair_estimate.pdf",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createClaim({
        ...formData,
        police_report_filed: formData.police_report_filed as "Yes" | "No",
        witness_present: formData.witness_present as "Yes" | "No",
        customer_age: Number(formData.customer_age),
        claim_amount: Number(formData.claim_amount),
        number_of_previous_claims: Number(formData.number_of_previous_claims),
        previous_claim_payouts: Number(formData.previous_claim_payouts),
      });
      onClaimCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit new claim");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-800 bg-[#0c1220] p-6 text-slate-100 shadow-2xl shadow-black my-8 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <FilePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Submit New Insurance Claim</h2>
              <p className="text-xs text-slate-400">
                Data will be processed immediately by the XGBoost & Isolation Forest inference pipeline
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

        {error && (
          <div className="mt-4 rounded-lg bg-red-950/40 border border-red-500/30 p-3 text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Customer Name</label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Customer ID</label>
              <input
                type="text"
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Customer Age</label>
              <input
                type="number"
                min="18"
                max="99"
                required
                value={formData.customer_age}
                onChange={(e) => setFormData({ ...formData, customer_age: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Insurance Type</label>
              <select
                value={formData.insurance_type}
                onChange={(e) => setFormData({ ...formData, insurance_type: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="Auto">Auto Insurance</option>
                <option value="Property">Property Insurance</option>
                <option value="Health">Health Insurance</option>
                <option value="Life">Life Insurance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Policy Number</label>
              <input
                type="text"
                required
                value={formData.policy_number}
                onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Claim Amount ($)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={formData.claim_amount}
                onChange={(e) => setFormData({ ...formData, claim_amount: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Policy Start Date</label>
              <input
                type="date"
                required
                value={formData.policy_start_date}
                onChange={(e) => setFormData({ ...formData, policy_start_date: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Incident Date</label>
              <input
                type="date"
                required
                value={formData.incident_date}
                onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Claim Submission Date</label>
              <input
                type="date"
                required
                value={formData.claim_submission_date}
                onChange={(e) => setFormData({ ...formData, claim_submission_date: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Incident Location (City, State)</label>
              <input
                type="text"
                required
                value={formData.incident_location}
                onChange={(e) => setFormData({ ...formData, incident_location: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Region</label>
              <select
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="Northeast">Northeast</option>
                <option value="Midwest">Midwest</option>
                <option value="South">South</option>
                <option value="West">West</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Damage Severity</label>
              <select
                value={formData.damage_severity}
                onChange={(e) => setFormData({ ...formData, damage_severity: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="Minor">Minor</option>
                <option value="Moderate">Moderate</option>
                <option value="Major">Major</option>
                <option value="Total Loss">Total Loss</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Police Report Filed</label>
              <select
                value={formData.police_report_filed}
                onChange={(e) => setFormData({ ...formData, police_report_filed: e.target.value as any })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Witness Present</label>
              <select
                value={formData.witness_present}
                onChange={(e) => setFormData({ ...formData, witness_present: e.target.value as any })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Number of Prior Claims</label>
              <input
                type="number"
                min="0"
                max="15"
                value={formData.number_of_previous_claims}
                onChange={(e) => setFormData({ ...formData, number_of_previous_claims: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Incident Description</label>
            <textarea
              rows={3}
              required
              value={formData.incident_description}
              onChange={(e) => setFormData({ ...formData, incident_description: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" />
              <span>{submitting ? "Analyzing Risk..." : "Submit & Evaluate Claim"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
