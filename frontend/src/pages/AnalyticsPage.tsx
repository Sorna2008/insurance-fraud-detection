import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Layers,
  Award,
  TrendingUp,
  Cpu,
  Target,
  FileCheck2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BenchmarkData } from "../types";
import { api } from "../services/api";

export const AnalyticsPage: React.FC = () => {
  const [benchmarks, setBenchmarks] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModelTab, setActiveModelTab] = useState<"xgboost" | "random_forest" | "logistic_regression">("xgboost");

  useEffect(() => {
    api
      .getModelBenchmarks()
      .then((data) => setBenchmarks(data))
      .catch((e) => console.error("Error loading model benchmarks:", e))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !benchmarks) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading model performance metrics and confusion matrices...</p>
        </div>
      </div>
    );
  }

  const { models, champion, feature_importances, dataset_size, test_size } = benchmarks;
  const currentModel = models[activeModelTab];
  const cm = currentModel.confusion_matrix;

  // Calculate False Positive Rate and False Negative Rate
  const totalNegatives = cm.tn + cm.fp;
  const totalPositives = cm.tp + cm.fn;
  const falsePositiveRate = totalNegatives > 0 ? ((cm.fp / totalNegatives) * 100).toFixed(2) : "0.00";
  const falseNegativeRate = totalPositives > 0 ? ((cm.fn / totalPositives) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Model Performance & Advanced Analytics
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Validated machine learning benchmarks, stratified test split evaluations, ROC-AUC, and feature rankings
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/20 px-3.5 py-1.5 text-xs text-emerald-300">
          <Award className="h-4 w-4 text-emerald-400" />
          <span>
            Selected Champion: <strong>{champion}</strong>
          </span>
        </div>
      </div>

      {/* Cross-Model Comparison Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Algorithm Benchmark Comparison</h3>
            <p className="text-xs text-slate-400">
              Evaluated on {test_size.toLocaleString()} held-out claims (20% stratified test split, no data leakage)
            </p>
          </div>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
            Total Dataset: {dataset_size.toLocaleString()} claims
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Algorithm</th>
                <th className="py-3 px-4">ROC-AUC</th>
                <th className="py-3 px-4">F1-Score</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">Recall</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {/* XGBoost */}
              <tr
                onClick={() => setActiveModelTab("xgboost")}
                className={`cursor-pointer transition ${
                  activeModelTab === "xgboost" ? "bg-indigo-600/10" : "hover:bg-slate-800/40"
                }`}
              >
                <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                  <span>{models.xgboost.name}</span>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-emerald-400">{models.xgboost.roc_auc}</td>
                <td className="py-3 px-4 font-mono">{models.xgboost.f1_score}</td>
                <td className="py-3 px-4 font-mono">{models.xgboost.precision}</td>
                <td className="py-3 px-4 font-mono">{models.xgboost.recall}</td>
                <td className="py-3 px-4 font-mono">{models.xgboost.accuracy}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    Champion
                  </span>
                </td>
              </tr>

              {/* Random Forest */}
              <tr
                onClick={() => setActiveModelTab("random_forest")}
                className={`cursor-pointer transition ${
                  activeModelTab === "random_forest" ? "bg-indigo-600/10" : "hover:bg-slate-800/40"
                }`}
              >
                <td className="py-3 px-4 font-medium text-slate-200 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                  <span>{models.random_forest.name}</span>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-blue-400">{models.random_forest.roc_auc}</td>
                <td className="py-3 px-4 font-mono">{models.random_forest.f1_score}</td>
                <td className="py-3 px-4 font-mono">{models.random_forest.precision}</td>
                <td className="py-3 px-4 font-mono">{models.random_forest.recall}</td>
                <td className="py-3 px-4 font-mono">{models.random_forest.accuracy}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] text-slate-300">
                    Challenger
                  </span>
                </td>
              </tr>

              {/* Logistic Regression */}
              <tr
                onClick={() => setActiveModelTab("logistic_regression")}
                className={`cursor-pointer transition ${
                  activeModelTab === "logistic_regression" ? "bg-indigo-600/10" : "hover:bg-slate-800/40"
                }`}
              >
                <td className="py-3 px-4 font-medium text-slate-200 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                  <span>{models.logistic_regression.name}</span>
                </td>
                <td className="py-3 px-4 font-mono font-bold text-amber-400">{models.logistic_regression.roc_auc}</td>
                <td className="py-3 px-4 font-mono">{models.logistic_regression.f1_score}</td>
                <td className="py-3 px-4 font-mono">{models.logistic_regression.precision}</td>
                <td className="py-3 px-4 font-mono">{models.logistic_regression.recall}</td>
                <td className="py-3 px-4 font-mono">{models.logistic_regression.accuracy}</td>
                <td className="py-3 px-4 text-right">
                  <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] text-slate-300">
                    Baseline
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 2: Confusion Matrix & ROC Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Confusion Matrix ({currentModel.name})</h3>
              <span className="text-xs text-slate-400">Test Split: {test_size} Claims</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Classification outcomes mapping actual versus predicted fraud
            </p>
          </div>

          {/* 2x2 Confusion Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full my-2">
            {/* True Negative */}
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                True Negatives (TN)
              </p>
              <p className="text-2xl font-black text-white mt-1 font-mono">{cm.tn}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Legitimate claims approved</p>
            </div>

            {/* False Positive */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                False Positives (FP)
              </p>
              <p className="text-2xl font-black text-amber-400 mt-1 font-mono">{cm.fp}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Legitimate claims flagged for SIU</p>
            </div>

            {/* False Negative */}
            <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-red-400 tracking-wider">
                False Negatives (FN)
              </p>
              <p className="text-2xl font-black text-red-400 mt-1 font-mono">{cm.fn}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Missed fraudulent claims</p>
            </div>

            {/* True Positive */}
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 text-center">
              <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                True Positives (TP)
              </p>
              <p className="text-2xl font-black text-white mt-1 font-mono">{cm.tp}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Correctly detected fraud</p>
            </div>
          </div>

          {/* FPR & FNR metrics */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-slate-950/50">
              <span className="text-slate-400">False Positive Rate (FPR):</span>
              <span className="font-bold text-amber-400 font-mono">{falsePositiveRate}%</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-950/50">
              <span className="text-slate-400">False Negative Rate (FNR):</span>
              <span className="font-bold text-red-400 font-mono">{falseNegativeRate}%</span>
            </div>
          </div>
        </div>

        {/* ROC Curve Chart */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Receiver Operating Characteristic (ROC)</h3>
              <p className="text-xs text-slate-400">True Positive Rate vs False Positive Rate curve</p>
            </div>
            <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
              AUC: {currentModel.roc_auc}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={currentModel.roc_curve} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="fpr" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: "FPR", position: "insideBottom", offset: -5 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: "TPR", angle: -90, position: "insideLeft" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tpr"
                  name="Model TPR"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Feature Importance Ranking */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white">Global Feature Importance Ranking</h3>
            <p className="text-xs text-slate-400">
              Primary variables driving XGBoost tree branch splits across all claims
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={feature_importances.slice(0, 10).map((f) => ({
                feature: f.feature.replace(/_/g, " "),
                importance: f.importance,
              }))}
              margin={{ top: 10, right: 10, left: -10, bottom: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="feature" stroke="#64748b" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="importance" name="Relative Split Weight" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
