import React, { useState, useEffect } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import "./styles/variables.css";
import "./styles/layout.css";
import Header from "./components/Header";
import BlueprintsPanel from "./components/BlueprintsPanel";
import JobsPanel from "./components/JobsPanel";
import AdminPanel from "./components/AdminPanel";
import AuthCallback from "./components/AuthCallback";
import Footer from "./components/Footer";

/**
 * Main App component
 * Manages only top-level navigation state - all business logic is delegated to panel components
 */
function App() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    // Initialize from URL query parameter if present
    return searchParams.get("tab") || "blueprints";
  });
  const [updateResourceData, setUpdateResourceData] = useState(null);

  // Update tab when query parameter changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleUpdateResource = (job) => {
    setUpdateResourceData(job);
    setActiveTab("blueprints");
  };

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={
        <div className="app-root">
          <div className="app-shell">
            <Header activeTab={activeTab} onTabChange={setActiveTab} />

            <main className="app-main">
              {activeTab === "blueprints" && (
                <BlueprintsPanel
                  updateResourceData={updateResourceData}
                  onClearUpdate={() => setUpdateResourceData(null)}
                />
              )}
              {activeTab === "jobs" && (
                <JobsPanel
                  isActive={true}
                  onUpdateResource={handleUpdateResource}
                />
              )}
              {activeTab === "admin" && (
                <AdminPanel />
              )}
            </main>

            <Footer />
          </div>
        </div>
      } />
    </Routes>
  );
}

export default App;
