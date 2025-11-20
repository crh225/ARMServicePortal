import React, { useState, useEffect } from "react";
import EmptyState from "../shared/EmptyState";
import "../../styles/BlueprintsList.css";

function BlueprintsList({ blueprints, selectedBlueprint, onSelectBlueprint }) {
  const [showAllBlueprints, setShowAllBlueprints] = useState(true);

  // Reset to show all blueprints when selectedBlueprint becomes null (e.g., after PR creation)
  useEffect(() => {
    if (!selectedBlueprint) {
      setShowAllBlueprints(true);
      // Scroll to top when blueprint is cleared
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedBlueprint]);

  // When a blueprint is selected and we're not showing all, show only the selected one
  const displayedBlueprints = showAllBlueprints || !selectedBlueprint
    ? blueprints
    : blueprints.filter(bp => bp.id === selectedBlueprint.id);

  const handleBlueprintClick = (id) => {
    onSelectBlueprint(id);
    setShowAllBlueprints(false);
  };

  const handleStartOver = () => {
    setShowAllBlueprints(true);
    onSelectBlueprint(null);
  };

  return (
    <div>
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="panel-title">1. Choose a Blueprint</h2>
          {selectedBlueprint && !showAllBlueprints && (
            <button
              className="reset-btn"
              onClick={handleStartOver}
            >
              ← Start Over
            </button>
          )}
        </div>
        <p className="panel-help">
          These are your approved Terraform-backed building blocks.
        </p>
      </div>

      <div className="blueprint-list">
        {displayedBlueprints.map((bp) => (
          <button
            key={bp.id}
            className={
              "blueprint-card" +
              (selectedBlueprint?.id === bp.id
                ? " blueprint-card--active"
                : "")
            }
            onClick={() => handleBlueprintClick(bp.id)}
          >
            <div className="blueprint-header">
              <h3 className="blueprint-title">{bp.displayName}</h3>
              {bp.version && (
                <span className="blueprint-version">v{bp.version}</span>
              )}
            </div>
            <p className="blueprint-desc">{bp.description}</p>
          </button>
        ))}

        {blueprints.length === 0 && (
          <EmptyState
            message="No blueprints found yet."
            subMessage="Add modules in the infra folder and expose them via the API."
          />
        )}
      </div>
    </div>
  );
}

export default BlueprintsList;
