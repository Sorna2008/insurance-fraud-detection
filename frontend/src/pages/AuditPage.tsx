import React, { useState, useEffect } from "react";
import { History, Shield, Filter, RefreshCw, UserCheck, Clock, FileText } from "lucide-react";
import { AuditLog } from "../types";
import { api } from "../services/api";

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchLogs = async () => {
    try {
      const data = await api.getAuditLogs(60);
      setLogs(data);
    } catch (e) {
      console.error("Error loading audit logs:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              System Audit Trail & Compliance Log
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Immutable tracking of fraud predictions, investigator determinations, evidence uploads, and logins
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 hover:bg-slate-800 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
          <span>Refresh Audit Stream</span>
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User / Actor</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Entity ID</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <span>Loading audit stream...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition font-mono">
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-200">
                      {log.username}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          log.action.includes("CONFIRMED") || log.action.includes("FRAUD")
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : log.action.includes("CREATED")
                            ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                            : log.action.includes("LOGIN")
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400">{log.entity_type}</td>
                    <td className="py-3 px-4 text-white font-bold">{log.entity_id}</td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-xs truncate">
                      {log.details || "--"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
