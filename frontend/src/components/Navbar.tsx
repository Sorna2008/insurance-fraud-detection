import React, { useState } from "react";
import {
  ShieldAlert,
  Search,
  Bell,
  UserCheck,
  ChevronDown,
  Info,
  CheckCircle2,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";

interface NavbarProps {
  onSearch?: (term: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, activeTab, setActiveTab }) => {
  const { user, role, switchRole, logout } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchTerm);
    if (activeTab !== "claims") {
      setActiveTab("claims");
    }
  };

  const rolesList: { role: UserRole; label: string; desc: string }[] = [
    {
      role: "Admin",
      label: "Admin",
      desc: "Full administrative access, user management, global analytics",
    },
    {
      role: "Fraud Investigator",
      label: "Fraud Investigator",
      desc: "SIU workspace, evidence review, record final determinations",
    },
    {
      role: "Claims Officer",
      label: "Claims Officer",
      desc: "Intake claims, verify preliminary policy status, track claims",
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-[#090d16]/90 px-6 backdrop-blur-md">
      {/* Brand & Synthetic Disclaimer */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-700 shadow-lg shadow-indigo-500/20">
            <ShieldAlert className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">InsureGuard</span>
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400">
                AI SIU
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Enterprise Insurance Fraud Platform</p>
          </div>
        </div>

        {/* Synthetic Data Disclaimer Banner */}
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
          <Info className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
          <span>
            <strong>Synthetic Demonstration Dataset:</strong> Model provides decision support for human investigators.
          </span>
        </div>
      </div>

      {/* Global Search Input */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex relative w-80 items-center">
        <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search Claim ID, Customer, Policy #..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-slate-700/80 bg-slate-900/80 py-1.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </form>

      {/* Right Controls: Role Switcher & User Profile */}
      <div className="flex items-center gap-4">
        {/* Backend Status indicator */}
        <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="hidden sm:inline">Engine Live</span>
        </div>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition"
          >
            <UserCheck className="h-4 w-4 text-indigo-400" />
            <div className="text-left">
              <span className="block text-[10px] uppercase font-semibold text-slate-400 leading-none">Role</span>
              <span className="font-medium text-white">{role}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl shadow-black z-50 animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-xs font-semibold text-white">Switch Active Persona</p>
                <p className="text-[11px] text-slate-400">Test role-based permissions and workflows</p>
              </div>
              <div className="mt-1 space-y-1">
                {rolesList.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => {
                      switchRole(r.role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left rounded-lg p-2.5 text-xs transition ${
                      role === r.role
                        ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                        : "hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200">{r.label}</span>
                      {role === r.role && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="hidden sm:flex items-center gap-2.5 border-l border-slate-800 pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-indigo-300">
            {user?.full_name?.split(" ").map((n) => n[0]).slice(0, 2).join("") || "AD"}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-xs font-medium text-slate-200">{user?.full_name || "Sarah Jenkins"}</p>
            <p className="text-[10px] text-slate-500 capitalize">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
