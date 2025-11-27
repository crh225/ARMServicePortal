import { useState, useEffect } from "react";
import EmptyState from "../shared/EmptyState";
import BlueprintsListSkeleton from "./BlueprintsListSkeleton";
import "../../styles/BlueprintsList.css";

// Category icons and colors
const categoryConfig = {
  "Storage": { icon: "💾", color: "#10b981" },
  "Database": { icon: "🗄️", color: "#8b5cf6" },
  "Compute": { icon: "⚡", color: "#f59e0b" },
  "Networking": { icon: "🌐", color: "#3b82f6" },
  "Web": { icon: "🌍", color: "#06b6d4" },
  "Security": { icon: "🔐", color: "#ef4444" },
  "Analytics & Monitoring": { icon: "📊", color: "#ec4899" },
  "default": { icon: "📦", color: "#6b7280" }
};

// Provider/engine configuration with official logos
const providerConfig = {
  "terraform": {
    name: "Terraform",
    color: "#5c4ee5",
    icon: (
      <svg width="14" height="14" viewBox="0 0 128 128">
        <g fillRule="evenodd">
          <path d="M77.941 44.5v36.836L46.324 62.918V26.082zm0 0" fill="currentColor"/>
          <path d="M81.41 81.336l31.633-18.418V26.082L81.41 44.5zm0 0" fill="currentColor" fillOpacity="0.6"/>
          <path d="M11.242 42.36L42.86 60.776V23.941L11.242 5.523zm0 0M77.941 85.375L46.324 66.957v36.82l31.617 18.418zm0 0" fill="currentColor"/>
        </g>
      </svg>
    )
  },
  "crossplane": {
    name: "Crossplane",
    color: "#35d0ba",
    icon: (
      <img
        src="https://raw.githubusercontent.com/cncf/artwork/main/projects/crossplane/icon/color/crossplane-icon-color.svg"
        alt=""
        width="16"
        height="16"
        style={{ verticalAlign: "middle" }}
      />
    )
  }
};

// Get provider from blueprint (default to terraform)
function getProvider(bp) {
  return bp.provider || "terraform";
}

// Get category from blueprint (infer from name/description if not set)
function getCategory(bp) {
  if (bp.category) return bp.category;
  const name = bp.displayName.toLowerCase();
  if (name.includes("storage")) return "Storage";
  if (name.includes("postgres") || name.includes("database") || name.includes("sql")) return "Database";
  if (name.includes("container") || name.includes("vm") || name.includes("compute")) return "Compute";
  if (name.includes("front door") || name.includes("network") || name.includes("vnet")) return "Networking";
  if (name.includes("website") || name.includes("web") || name.includes("static")) return "Web";
  if (name.includes("key vault") || name.includes("secret")) return "Security";
  if (name.includes("elastic") || name.includes("monitor") || name.includes("log")) return "Analytics & Monitoring";
  return "Infrastructure";
}

function BlueprintsList({ blueprints, selectedBlueprint, onSelectBlueprint, loading = false }) {
  const [showAllBlueprints, setShowAllBlueprints] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset to show all blueprints when selectedBlueprint becomes null (e.g., after PR creation)
  useEffect(() => {
    if (!selectedBlueprint) {
      setShowAllBlueprints(true);
      // Scroll to top when blueprint is cleared
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedBlueprint]);

  // Show skeleton while loading
  if (loading) {
    return <BlueprintsListSkeleton />;
  }

  // Filter blueprints based on search
  const filteredBlueprints = blueprints.filter(bp => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bp.displayName.toLowerCase().includes(query) ||
      bp.description.toLowerCase().includes(query) ||
      getCategory(bp).toLowerCase().includes(query)
    );
  });

  // When a blueprint is selected and we're not showing all, show only the selected one
  const displayedBlueprints = showAllBlueprints || !selectedBlueprint
    ? filteredBlueprints
    : filteredBlueprints.filter(bp => bp.id === selectedBlueprint.id);

  const handleBlueprintClick = (id) => {
    onSelectBlueprint(id);
    setShowAllBlueprints(false);
  };

  return (
    <div>
      <div className="blueprint-header-section">
        <div>
          <h2 className="panel-title">Service Catalog</h2>
          <p className="panel-help">
            Choose from pre-approved infrastructure templates
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="blueprint-search">
        <svg className="blueprint-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path fillRule="evenodd" d="M11.5 7a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z"/>
        </svg>
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="blueprint-search-input"
        />
      </div>

      <div className="blueprint-grid">
        {displayedBlueprints.map((bp) => {
          const category = getCategory(bp);
          const config = categoryConfig[category] || categoryConfig.default;
          const provider = getProvider(bp);
          const providerInfo = providerConfig[provider] || providerConfig.terraform;

          return (
            <button
              key={bp.id}
              className={
                "blueprint-card" +
                (selectedBlueprint?.id === bp.id ? " blueprint-card--active" : "")
              }
              onClick={() => handleBlueprintClick(bp.id)}
            >
              <div className="blueprint-card-header">
                <div
                  className="blueprint-icon"
                  style={{ backgroundColor: `${config.color}15`, color: config.color }}
                >
                  {config.icon}
                </div>
                <div className="blueprint-meta">
                  <span
                    className="blueprint-category"
                    style={{ color: config.color }}
                  >
                    {category}
                  </span>
                  {bp.version && (
                    <span className="blueprint-version">v{bp.version}</span>
                  )}
                </div>
              </div>

              <h3 className="blueprint-title">{bp.displayName}</h3>
              <p className="blueprint-desc">{bp.description}</p>

              <div className="blueprint-footer">
                <span
                  className="blueprint-provider"
                  style={{ backgroundColor: `${providerInfo.color}15`, color: providerInfo.color }}
                >
                  {providerInfo.icon}
                  {providerInfo.name}
                </span>
                {(bp.estimatedMonthlyCost !== undefined && bp.estimatedMonthlyCost !== null) && (
                  <span className="blueprint-cost">
                    ~${bp.estimatedMonthlyCost === 0 ? "0" : bp.estimatedMonthlyCost}/mo
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {blueprints.length === 0 && (
          <EmptyState
            message="No blueprints found yet."
            subMessage="Add modules in the infra folder and expose them via the API."
          />
        )}

        {blueprints.length > 0 && displayedBlueprints.length === 0 && searchQuery && (
          <div className="blueprint-no-results">
            <p>No templates match "{searchQuery}"</p>
            <button onClick={() => setSearchQuery("")} className="blueprint-clear-search">
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlueprintsList;
