import React, { useState, useEffect } from "react";
import {
  BrainCircuit,
  Sliders,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FileText,
  Info,
  CheckSquare,
  Square,
  RefreshCw,
} from "lucide-react";
import { FraudPrediction } from "../types";
import { ShapWaterfallChart } from "../components/ShapWaterfallChart";
import { api } from "../services/api";

export const ExplainableAiPage: React.FC = () => {
  // Simulator input parameters
  const [params, setParams] = useState({
    customer_age: 42,
    annual_income: 55000,
    credit_score: 580,
    insurance_type: "Auto",
    coverage_limit: 50000,
    deductible: 1000,
    premium_amount: 1400,
    claim_amount: 47500,
    policy_start_date: "2026-09-01",
    incident_date: "2026-09-15", // 14 days after inception!
    claim_submission_date: "2026-10-25", // 40 days delay!
    region: "Northeast",
    incident_type: "Single Vehicle Collision",
    damage_severity: "Major",
    police_report_filed: "No",
    witness_present: "No",
    number_of_previous_claims: 3,
    previous_claim_payouts: 24000,
    supporting_documents_count: 1,
  });

  const [prediction, setPrediction] = useState<FraudPrediction | null>(null);
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [checkedList, setCheckedList] = useState<Record<number, boolean>>({});

  const runEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await api.evaluateSimulation(params);
      setPrediction(res);
      setCheckedList({});
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    runEvaluation();
  }, []);

  const isHighRisk = prediction?.risk_category === "High";
  const isMedRisk = prediction?.risk_category === "Medium";

  return (
    <div className="space-y-6 pb-12">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Explainable AI (XAI) & Simulation Lab
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            SHapley Additive exPlanations (SHAP) feature attribution, natural language risk synthesis, and what-if exploration
          </p>
        </div>

        <button
          onClick={runEvaluation}
          disabled={evaluating}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 disabled:opacity-60"
        >
          <Sparkles className={`h-4 w-4 ${evaluating ? "animate-spin" : ""}`} />
          <span>{evaluating ? "Computing SHAP..." : "Re-Run SHAP Inference"}</span>
        </button>
      </div>

      {/* Regulatory Banner */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 text-xs text-indigo-200 flex items-start gap-3">
        <Info className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Algorithmic Accountability & Fairness Notice:</p>
          <p className="text-indigo-300 leading-relaxed">
            In compliance with insurance fraud regulations, this model identifies anomalous behavioral patterns
            (such as reporting delay, claim-to-coverage saturation, staging proximity, and absent official verification).
            Protected attributes or geographic territory alone are never treated as proof of fraud. Model output is
            strictly an investigative aid for human decision-makers.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Interactive What-If Simulator */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">What-If Feature Simulator</h3>
            </div>
            <span className="text-[11px] text-slate-400">Tweak parameters</span>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Preset scenario shortcuts */}
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1.5">
                Quick Test Scenarios:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setParams({
                      ...params,
                      claim_amount: 48000,
                      coverage_limit: 50000,
                      policy_start_date: "2026-09-01",
                      incident_date: "2026-09-12",
                      claim_submission_date: "2026-10-25",
                      police_report_filed: "No",
                      witness_present: "No",
                      damage_severity: "Total Loss",
                      number_of_previous_claims: 4,
                    })
                  }
                  className="rounded-lg border border-red-500/30 bg-red-950/20 py-1.5 px-2 text-[11px] font-medium text-red-300 hover:bg-red-900/30 transition text-center"
                >
                  Staged Loss (High)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setParams({
                      ...params,
                      claim_amount: 14000,
                      coverage_limit: 50000,
                      policy_start_date: "2024-02-10",
                      incident_date: "2026-09-15",
                      claim_submission_date: "2026-10-05",
                      police_report_filed: "No",
                      witness_present: "Yes",
                      damage_severity: "Moderate",
                      number_of_previous_claims: 2,
                    })
                  }
                  className="rounded-lg border border-amber-500/30 bg-amber-950/20 py-1.5 px-2 text-[11px] font-medium text-amber-300 hover:bg-amber-900/30 transition text-center"
                >
                  Delayed (Medium)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setParams({
                      ...params,
                      claim_amount: 3200,
                      coverage_limit: 50000,
                      policy_start_date: "2023-01-15",
                      incident_date: "2026-10-10",
                      claim_submission_date: "2026-10-12",
                      police_report_filed: "Yes",
                      witness_present: "Yes",
                      damage_severity: "Minor",
                      number_of_previous_claims: 0,
                    })
                  }
                  className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 py-1.5 px-2 text-[11px] font-medium text-emerald-300 hover:bg-emerald-900/30 transition text-center"
                >
                  Clean (Low Risk)
                </button>
              </div>
            </div>

            {/* Claim Amount Slider */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Claim Amount:</span>
                <span className="font-bold text-white font-mono">${params.claim_amount.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={params.claim_amount}
                onChange={(e) => setParams({ ...params, claim_amount: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>$500</span>
                <span>Limit: ${params.coverage_limit.toLocaleString()}</span>
                <span>$100,000</span>
              </div>
            </div>

            {/* Prior Claims Count */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Prior Claims in Past 3 Years:</span>
                <span className="font-bold text-white">{params.number_of_previous_claims} claims</span>
              </div>
              <input
                type="range"
                min="0"
                max="7"
                step="1"
                value={params.number_of_previous_claims}
                onChange={(e) =>
                  setParams({ ...params, number_of_previous_claims: Number(e.target.value) })
                }
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Police Report & Witness Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Police Report Filed?</label>
                <select
                  value={params.police_report_filed}
                  onChange={(e) => setParams({ ...params, police_report_filed: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="Yes">Yes (Corroborated)</option>
                  <option value="No">No (Uncorroborated)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Third-Party Witness?</label>
                <select
                  value={params.witness_present}
                  onChange={(e) => setParams({ ...params, witness_present: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {/* Damage Severity & Line */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Damage Severity</label>
                <select
                  value={params.damage_severity}
                  onChange={(e) => setParams({ ...params, damage_severity: e.target.value as any })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="Minor">Minor</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Major">Major</option>
                  <option value="Total Loss">Total Loss</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Insurance Line</label>
                <select
                  value={params.insurance_type}
                  onChange={(e) => setParams({ ...params, insurance_type: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
                >
                  <option value="Auto">Auto</option>
                  <option value="Property">Property</option>
                  <option value="Health">Health</option>
                  <option value="Life">Life</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Policy Start Date</label>
                <input
                  type="date"
                  value={params.policy_start_date}
                  onChange={(e) => setParams({ ...params, policy_start_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Incident Date</label>
                <input
                  type="date"
                  value={params.incident_date}
                  onChange={(e) => setParams({ ...params, incident_date: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={runEvaluation}
                disabled={evaluating}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20"
              >
                {evaluating ? "Analyzing Simulation..." : "Simulate Fraud Risk & SHAP Waterfall"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): SHAP Explanations & Risk Decomposition */}
        <div className="lg:col-span-7 space-y-5">
          {/* Risk Score Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Circular Score Gauge */}
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black shadow-xl ${
                    isHighRisk
                      ? "bg-red-500/20 text-red-400 border border-red-500/40 shadow-red-500/10"
                      : isMedRisk
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-amber-500/10"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-emerald-500/10"
                  }`}
                >
                  {prediction?.risk_score ?? "--"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">
                      Predicted Fraud Risk: {prediction?.risk_score}/100
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isHighRisk
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : isMedRisk
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {prediction?.risk_category} Risk
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Isolation Forest Anomaly Score:{" "}
                    <strong className="text-white">{prediction?.anomaly_score}</strong> | Supervised ML:{" "}
                    <strong className="text-white">XGBoost 3.4</strong>
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Suspicion Factors */}
            {prediction?.top_risk_indicators && prediction.top_risk_indicators.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-300">Flagged Risk Drivers:</p>
                <div className="space-y-1.5">
                  {prediction.top_risk_indicators.map((ind, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-lg bg-red-950/20 border border-red-500/20 p-2 text-xs text-red-300"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                      <span>{ind}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SHAP Waterfall Feature Attribution Chart */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">SHAP Feature Attribution Values</h3>
                <p className="text-xs text-slate-400">
                  Quantified mathematical contribution of each feature towards or away from suspicion
                </p>
              </div>
              <span className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 text-[10px] font-bold text-indigo-300">
                TreeSHAP
              </span>
            </div>

            <ShapWaterfallChart contributions={prediction?.shap_contributions || []} />
          </div>

          {/* Natural Language Synthesis & Checklist */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Natural Language Risk Synthesis</h3>
              <div className="rounded-lg bg-slate-950/50 p-3.5 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {prediction?.natural_language_explanation}
              </div>
            </div>

            {prediction?.investigation_checklist && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-indigo-300 mb-2">
                  Investigator Evidence Verification Checklist:
                </h3>
                <div className="space-y-2">
                  {prediction.investigation_checklist.map((item, idx) => {
                    const isChecked = !!checkedList[idx];
                    return (
                      <div
                        key={idx}
                        onClick={() => setCheckedList({ ...checkedList, [idx]: !isChecked })}
                        className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs cursor-pointer transition ${
                          isChecked
                            ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-300"
                            : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={isChecked ? "line-through opacity-70" : ""}>{item}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
