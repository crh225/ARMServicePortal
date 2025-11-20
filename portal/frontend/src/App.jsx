import React, { useState, useEffect } from "react";
import { Routes, Route, useSearchParams } from "react-router-dom";
import "./styles/variables.css";
import "./styles/layout.css";
import Header from "./components/shared/Header";
import BlueprintsPanel from "./components/blueprints/BlueprintsPanel";
import JobsPanel from "./components/jobs/JobsPanel";
import ResourcesPanel from "./components/resources/ResourcesPanel";
import AdminPanel from "./components/admin/AdminPanel";
import AuthCallback from "./components/shared/AuthCallback";
import Footer from "./components/shared/Footer";

/**
 * Main App component
 * Manages only top-level navigation state - all business logic is delegated to panel components
 */
function App() {
  const [searchParams, setSearchParams] = useSearchParams();
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
  }, [searchParams, activeTab]);

  // Handle tab change and update URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tab);
    // Remove job parameter when switching tabs (unless staying on jobs tab)
    if (tab !== "jobs" && newParams.has("job")) {
      newParams.delete("job");
    }
    setSearchParams(newParams);
  };

  const handleUpdateResource = (job) => {
    setUpdateResourceData(job);
    handleTabChange("blueprints");
  };

  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={
        <div className="app-root">
          <div className="app-shell">
            <Header activeTab={activeTab} onTabChange={handleTabChange} />

            <main className={`app-main ${(activeTab === "resources" || activeTab === "admin") ? "app-main--full" : ""}`}>
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
              {activeTab === "resources" && (
                <ResourcesPanel
                  isActive={true}
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
