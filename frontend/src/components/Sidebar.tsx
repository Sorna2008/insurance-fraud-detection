import React from "react";
import {
  LayoutDashboard,
  FileSpreadsheet,
  BrainCircuit,
  ShieldCheck,
  BarChart3,
  History,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingInvestigationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingInvestigationsCount = 0,
}) => {
  const navItems = [
    {
      id: "dashboard",
      label: "Admin Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "claims",
      label: "Claims Management",
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: "explainable-ai",
      label: "Explainable AI (XAI)",
      icon: BrainCircuit,
      badge: "SHAP",
    },
    {
      id: "investigations",
      label: "Investigation Workspace",
      icon: ShieldCheck,
      badge: pendingInvestigationsCount > 0 ? `${pendingInvestigationsCount}` : null,
      badgeColor: "bg-red-500/20 text-red-400 border border-red-500/30",
    },
    {
      id: "analytics",
      label: "Advanced Analytics",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "audit",
      label: "Audit Trail & Compliance",
      icon: History,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-800 bg-[#090d16] flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div>
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Fraud Surveillance
        </div>
        <nav className="mt-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-600/25"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      item.badgeColor
                        ? item.badgeColor
                        : isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Model Spec Footer Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Cpu className="h-4 w-4 text-indigo-400" />
            <span>ML Ensemble Engine</span>
          </div>
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
            v1.0
          </span>
        </div>
        <div className="space-y-1.5 text-[11px] text-slate-400">
          <div className="flex justify-between">
            <span>Primary Model:</span>
            <span className="font-medium text-slate-200">XGBoost 3.4</span>
          </div>
          <div className="flex justify-between">
            <span>Anomaly Scoring:</span>
            <span className="font-medium text-slate-200">Isolation Forest</span>
          </div>
          <div className="flex justify-between">
            <span>Test ROC-AUC:</span>
            <span className="font-semibold text-emerald-400">0.9225</span>
          </div>
          <div className="flex justify-between">
            <span>Explainability:</span>
            <span className="font-medium text-indigo-400">TreeSHAP Explainer</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
