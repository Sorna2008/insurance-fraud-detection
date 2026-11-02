import React from "react";
import { ShapContribution } from "../types";
import { ArrowUpRight, ArrowDownRight, Info } from "lucide-react";

interface ShapWaterfallChartProps {
  contributions: ShapContribution[];
}

export const ShapWaterfallChart: React.FC<ShapWaterfallChartProps> = ({ contributions }) => {
  if (!contributions || contributions.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-xs text-slate-500">
        No feature attribution data available for this claim.
      </div>
    );
  }

  // Sort by absolute SHAP impact
  const sorted = [...contributions].sort(
    (a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value)
  ).slice(0, 8);

  const maxAbs = Math.max(...sorted.map((c) => Math.abs(c.shap_value)), 0.1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
          <span>Protective / Mitigating (-Risk)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          <span>Suspicion Drivers (+Risk)</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {sorted.map((item, idx) => {
          const isPositiveRisk = item.shap_value > 0;
          const barWidthPercent = Math.min(100, Math.round((Math.abs(item.shap_value) / maxAbs) * 100));

          return (
            <div key={idx} className="group rounded-lg p-2 hover:bg-slate-800/40 transition">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5 font-medium text-slate-200">
                  {isPositiveRisk ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-400">val: {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</span>
                  <span
                    className={`font-semibold ${
                      isPositiveRisk ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {isPositiveRisk ? `+${item.shap_value.toFixed(3)}` : item.shap_value.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Divergence Bar Visualization */}
              <div className="relative h-2 w-full rounded-full bg-slate-800 overflow-hidden flex">
                <div className="w-1/2 flex justify-end">
                  {!isPositiveRisk && (
                    <div
                      style={{ width: `${barWidthPercent}%` }}
                      className="h-full rounded-l-full bg-gradient-to-l from-emerald-500 to-teal-400 transition-all duration-500"
                    />
                  )}
                </div>
                <div className="w-[2px] h-full bg-slate-600 z-10" />
                <div className="w-1/2 flex justify-start">
                  {isPositiveRisk && (
                    <div
                      style={{ width: `${barWidthPercent}%` }}
                      className="h-full rounded-r-full bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
