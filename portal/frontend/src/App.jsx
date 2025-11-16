import React, { useState } from "react";
import "./styles/variables.css";
import "./styles/layout.css";
import Header from "./components/Header";
import BlueprintsPanel from "./components/BlueprintsPanel";
import JobsPanel from "./components/JobsPanel";
import Footer from "./components/Footer";

/**
 * Main App component
 * Manages only top-level navigation state - all business logic is delegated to panel components
 */
function App() {
  const [activeTab, setActiveTab] = useState("blueprints");
  const [updateResourceData, setUpdateResourceData] = useState(null);

  const handleUpdateResource = (job) => {
    setUpdateResourceData(job);
    setActiveTab("blueprints");
  };

  return (
    <div className="app-root">
      <div className="app-shell">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />

        <main className="app-main">
          {activeTab === "blueprints" && (
            <BlueprintsPanel
              updateResourceData={updateResourceData}
              onUpdateComplete={() => setUpdateResourceData(null)}
            />
          )}
          {activeTab === "jobs" && (
            <JobsPanel
              isActive={true}
              onUpdateResource={handleUpdateResource}
            />
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
