import React, { useState, useEffect } from "react";
import EmptyState from "../shared/EmptyState";
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

// Provider/engine configuration
const providerConfig = {
  "terraform": {
    name: "Terraform",
    color: "#7B42BC",
    icon: (
      <svg width="12" height="12" viewBox="0 0 128 128" fill="currentColor">
        <path d="M44.5 2v42.5L81 22.3V2H44.5zm0 46.8v42.5l36.5-22.2V46.9L44.5 48.8zM85 27.6v42.5l36.5-22.2V5.4L85 27.6zM7 49.8v42.5l36.5-22.2V47.9L7 49.8z"/>
      </svg>
    )
  },
  "crossplane": {
    name: "Crossplane",
    color: "#1572B6",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45L12 11.09 5.1 7.63 12 4.18zM4 8.82l7 3.5v7.36l-7-3.5V8.82zm9 10.86v-7.36l7-3.5v7.36l-7 3.5z"/>
      </svg>
    )
  },
  "pulumi": {
    name: "Pulumi",
    color: "#F7BF2A",
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
      </svg>
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

function BlueprintsList({ blueprints, selectedBlueprint, onSelectBlueprint }) {
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
                <div className="blueprint-stats">
                  <span
                    className="blueprint-provider"
                    style={{ backgroundColor: `${providerInfo.color}15`, color: providerInfo.color }}
                  >
                    {providerInfo.icon}
                    {providerInfo.name}
                  </span>
                  <span className="blueprint-stat">
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                      <path fillRule="evenodd" d="M7.429 1.525a6.593 6.593 0 011.142 0c.036.003.108.036.137.146l.289 1.105c.147.56.55.967.997 1.189.174.086.341.183.501.29.417.278.97.423 1.53.27l1.102-.303c.11-.03.175.016.195.046.219.31.41.641.573.989.014.031.022.11-.059.19l-.815.806c-.411.406-.562.957-.53 1.456a4.588 4.588 0 010 .582c-.032.499.119 1.05.53 1.456l.815.806c.08.08.073.159.059.19a6.494 6.494 0 01-.573.989c-.02.03-.085.076-.195.046l-1.102-.303c-.56-.153-1.113-.008-1.53.27-.16.107-.327.204-.5.29-.449.222-.851.628-.998 1.189l-.289 1.105c-.029.11-.101.143-.137.146a6.613 6.613 0 01-1.142 0c-.036-.003-.108-.037-.137-.146l-.289-1.105c-.147-.56-.55-.967-.997-1.189a4.502 4.502 0 01-.501-.29c-.417-.278-.97-.423-1.53-.27l-1.102.303c-.11.03-.175-.016-.195-.046a6.494 6.494 0 01-.573-.989c-.014-.031-.022-.11.059-.19l.815-.806c.411-.406.562-.957.53-1.456a4.587 4.587 0 010-.582c.032-.499-.119-1.05-.53-1.456l-.815-.806c-.08-.08-.073-.159-.059-.19a6.44 6.44 0 01.573-.989c.02-.03.085-.076.195-.046l1.102.303c.56.153 1.113.008 1.53-.27.16-.107.327-.204.5-.29.449-.222.851-.628.998-1.189l.289-1.105c.029-.11.101-.143.137-.146zM8 0c-.236 0-.47.01-.701.03-.743.065-1.29.615-1.458 1.261l-.29 1.106c-.017.066-.078.158-.211.224a5.994 5.994 0 00-.668.386c-.123.082-.233.09-.3.071L3.27 2.776c-.644-.177-1.392.02-1.82.63a7.977 7.977 0 00-.704 1.217c-.315.675-.111 1.422.363 1.891l.815.806c.05.048.098.147.088.294a6.084 6.084 0 000 .772c.01.147-.037.246-.088.294l-.815.806c-.474.469-.678 1.216-.363 1.891.2.428.436.835.704 1.218.428.609 1.176.806 1.82.63l1.103-.303c.066-.019.176-.011.299.071.213.143.436.272.668.386.133.066.194.158.212.224l.289 1.106c.169.646.715 1.196 1.458 1.26a8.094 8.094 0 001.402 0c.743-.064 1.29-.614 1.458-1.26l.29-1.106c.017-.066.078-.158.211-.224a5.98 5.98 0 00.668-.386c.123-.082.233-.09.3-.071l1.102.302c.644.177 1.392-.02 1.82-.63.268-.382.505-.789.704-1.217.315-.675.111-1.422-.364-1.891l-.814-.806c-.05-.048-.098-.147-.088-.294a6.1 6.1 0 000-.772c-.01-.147.038-.246.088-.294l.814-.806c.475-.469.679-1.216.364-1.891a7.992 7.992 0 00-.704-1.218c-.428-.609-1.176-.806-1.82-.63l-1.103.303c-.066.019-.176.011-.299-.071a5.991 5.991 0 00-.668-.386c-.133-.066-.194-.158-.212-.224L10.16 1.29C9.99.645 9.444.095 8.701.031A8.094 8.094 0 008 0z"/>
                    </svg>
                    {bp.variables?.length || 0} params
                  </span>
                  {bp.outputs && bp.outputs.length > 0 && (
                    <span className="blueprint-stat">
                      <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                        <path fillRule="evenodd" d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"/>
                      </svg>
                      {bp.outputs.length} outputs
                    </span>
                  )}
                </div>
                {bp.estimatedMonthlyCost && (
                  <span className="blueprint-cost">
                    ~${bp.estimatedMonthlyCost}/mo
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
