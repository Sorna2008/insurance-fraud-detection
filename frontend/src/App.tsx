import React, { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { DashboardPage } from "./pages/DashboardPage";
import { ClaimsPage } from "./pages/ClaimsPage";
import { ExplainableAiPage } from "./pages/ExplainableAiPage";
import { InvestigationsPage } from "./pages/InvestigationsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AuditPage } from "./pages/AuditPage";
import { ClaimDetailModal } from "./components/ClaimDetailModal";

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const handleSelectClaim = (claimId: string) => {
    setSelectedClaimId(claimId);
  };

  const handleGlobalSearch = (term: string) => {
    setSearchQuery(term);
    setActiveTab("claims");
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        onSearch={handleGlobalSearch}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Layout (Sidebar + Content) */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0b0f19]">
          {activeTab === "dashboard" && (
            <DashboardPage
              onSelectClaim={handleSelectClaim}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "claims" && (
            <ClaimsPage
              onSelectClaim={handleSelectClaim}
              initialSearch={searchQuery}
            />
          )}

          {activeTab === "explainable-ai" && <ExplainableAiPage />}

          {activeTab === "investigations" && (
            <InvestigationsPage onSelectClaim={handleSelectClaim} />
          )}

          {activeTab === "analytics" && <AnalyticsPage />}

          {activeTab === "audit" && <AuditPage />}
        </main>
      </div>

      {/* Global Claim Detail & SHAP Explainability Slide-Over / Modal */}
      {selectedClaimId && (
        <ClaimDetailModal
          claimId={selectedClaimId}
          onClose={() => setSelectedClaimId(null)}
          onClaimUpdated={() => {
            // Can trigger a refresh if needed
          }}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
