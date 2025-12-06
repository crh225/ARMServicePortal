import { useState, useEffect } from "react";
import EmptyState from "../shared/EmptyState";
import BlueprintsListSkeleton from "./BlueprintsListSkeleton";
import "../../styles/BlueprintsList.css";

// Service-specific icons using official Azure icons from azure.microsoft.com/svghandler
const serviceIcons = {
  // Azure services - using official Microsoft icons where available
  "azure-rg-basic": {
    icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" alt="" width="24" height="24" />,
    color: "#0078d4"
  },
  "azure-storage-basic": {
    icon: <img src="https://azure.microsoft.com/svghandler/storage-accounts/?width=24&height=24" alt="" width="24" height="24" onError={(e) => { e.target.style.display='none'; }} />,
    color: "#0078d4"
  },
  "azure-key-vault-basic": {
    icon: <img src="https://azure.microsoft.com/svghandler/key-vaults/?width=24&height=24" alt="" width="24" height="24" onError={(e) => { e.target.style.display='none'; }} />,
    color: "#0078d4"
  },
  "azure-static-site": {
    icon: <img src="https://azure.microsoft.com/svghandler/static-web-apps/?width=24&height=24" alt="" width="24" height="24" onError={(e) => { e.target.style.display='none'; }} />,
    color: "#0078d4"
  },
  "azure-frontdoor": {
    icon: <img src="https://azure.microsoft.com/svghandler/front-doors/?width=24&height=24" alt="" width="24" height="24" onError={(e) => { e.target.style.display='none'; }} />,
    color: "#0078d4"
  },
  "azure-cdn": {
    icon: <img src="https://azure.microsoft.com/svghandler/cdn-profiles/?width=24&height=24" alt="" width="24" height="24" onError={(e) => { e.target.style.display='none'; }} />,
    color: "#0078d4"
  },
  "azure-aci": {
    icon: <img src="https://azure.microsoft.com/svghandler/container-instances/?width=24&height=24" alt="" width="24" height="24" onError={(e) => { e.target.style.display='none'; }} />,
    color: "#0078d4"
  },
  "azure-postgres-flexible": {
    icon: <img src="https://azure.microsoft.com/svghandler/azure-database-postgresql-server/?width=24&height=24" alt="" width="24" height="24" onError={(e) => { e.target.src='https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg'; }} />,
    color: "#336791"
  },
  "azure-elastic-managed": {
    icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elasticsearch/elasticsearch-original.svg" alt="" width="24" height="24" />,
    color: "#005571"
  },
  "azure-function": {
    icon: <img src="https://azure.microsoft.com/svghandler/function-apps/?width=24&height=24" alt="" width="24" height="24" onError={(e) => { e.target.style.display='none'; }} />,
    color: "#0062ad"
  },
  "azure-app-configuration": {
    icon: <img src="https://azure.microsoft.com/svghandler/app-configuration/?width=24&height=24" alt="" width="24" height="24" onError={(e) => { e.target.style.display='none'; }} />,
    color: "#0078d4"
  },
  "azure-ml-workspace": {
    icon: <img src="https://azure.microsoft.com/svghandler/machine-learning-service-workspaces/?width=24&height=24" alt="" width="24" height="24" onError={(e) => { e.target.style.display='none'; }} />,
    color: "#0078d4"
  },
  // Crossplane/K8s services
  "xp-application-environment": {
    icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg" alt="" width="24" height="24" />,
    color: "#326ce5"
  },
  "xp-building-blocks": {
    icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kubernetes/kubernetes-plain.svg" alt="" width="24" height="24" />,
    color: "#326ce5"
  },
  "xp-redis": {
    icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" alt="" width="24" height="24" />,
    color: "#dc382d"
  },
  "xp-rabbitmq": {
    icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rabbitmq/rabbitmq-original.svg" alt="" width="24" height="24" />,
    color: "#ff6600"
  }
};

// Category colors (used as fallback)
const categoryConfig = {
  "Storage": { color: "#0078d4" },
  "Database": { color: "#336791" },
  "Cache": { color: "#dc382d" },
  "Messaging": { color: "#ff6600" },
  "Compute": { color: "#326ce5" },
  "Networking": { color: "#0078d4" },
  "Web": { color: "#06b6d4" },
  "Security": { color: "#0078d4" },
  "Configuration": { color: "#0078d4" },
  "Analytics & Monitoring": { color: "#005571" },
  "AI & Machine Learning": { color: "#0078d4" },
  "default": { color: "#6b7280" }
};

// Default icons by category (fallback when no service-specific icon)
const defaultCategoryIcons = {
  "Storage": "💾",
  "Database": "🗄️",
  "Cache": "⚡",
  "Messaging": "📨",
  "Compute": "🖥️",
  "Networking": "🌐",
  "Web": "🌍",
  "Security": "🔐",
  "Configuration": "⚙️",
  "Analytics & Monitoring": "📊",
  "default": "📦"
};

// Deprecated blueprints - these will show a deprecated badge
const deprecatedBlueprints = {
  "azure-cdn": {
    reason: "Azure CDN Classic deprecated Oct 2025",
    alternative: "azure-frontdoor"
  }
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
  const [providerFilter, setProviderFilter] = useState("all"); // "all", "terraform", "crossplane"
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Get unique categories from blueprints
  const categories = [...new Set(blueprints.map(bp => getCategory(bp)))].sort();

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

  // Filter blueprints based on search, provider, and category
  const filteredBlueprints = blueprints.filter(bp => {
    // Provider filter
    if (providerFilter !== "all" && getProvider(bp) !== providerFilter) {
      return false;
    }

    // Category filter
    if (categoryFilter !== "all" && getCategory(bp) !== categoryFilter) {
      return false;
    }

    // Search filter
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

      {/* Search and Filters */}
      <div className="blueprint-filters">
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

        <div className="blueprint-filter-row">
          {/* Provider Pills */}
          <div className="blueprint-provider-pills">
            <button
              className={`blueprint-pill ${providerFilter === "all" ? "blueprint-pill--active" : ""}`}
              onClick={() => setProviderFilter("all")}
            >
              All
            </button>
            <button
              className={`blueprint-pill blueprint-pill--terraform ${providerFilter === "terraform" ? "blueprint-pill--active" : ""}`}
              onClick={() => setProviderFilter("terraform")}
            >
              <svg width="14" height="14" viewBox="0 0 128 128">
                <g fillRule="evenodd">
                  <path d="M77.941 44.5v36.836L46.324 62.918V26.082zm0 0" fill="currentColor"/>
                  <path d="M81.41 81.336l31.633-18.418V26.082L81.41 44.5zm0 0" fill="currentColor" fillOpacity="0.6"/>
                  <path d="M11.242 42.36L42.86 60.776V23.941L11.242 5.523zm0 0M77.941 85.375L46.324 66.957v36.82l31.617 18.418zm0 0" fill="currentColor"/>
                </g>
              </svg>
              Terraform
            </button>
            <button
              className={`blueprint-pill blueprint-pill--crossplane ${providerFilter === "crossplane" ? "blueprint-pill--active" : ""}`}
              onClick={() => setProviderFilter("crossplane")}
            >
              <img
                src="https://raw.githubusercontent.com/cncf/artwork/main/projects/crossplane/icon/color/crossplane-icon-color.svg"
                alt=""
                width="14"
                height="14"
              />
              Crossplane
            </button>
          </div>

          {/* Category Dropdown */}
          <select
            className="blueprint-category-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="blueprint-grid">
        {displayedBlueprints.map((bp) => {
          const category = getCategory(bp);
          const categoryColor = categoryConfig[category]?.color || categoryConfig.default.color;
          const provider = getProvider(bp);
          const providerInfo = providerConfig[provider] || providerConfig.terraform;

          // Get service-specific icon or fall back to category default
          const serviceIcon = serviceIcons[bp.id];
          const iconColor = serviceIcon?.color || categoryColor;
          const icon = serviceIcon?.icon || defaultCategoryIcons[category] || defaultCategoryIcons.default;
          const isDeprecated = deprecatedBlueprints[bp.id];

          return (
            <button
              key={bp.id}
              className={
                "blueprint-card" +
                (selectedBlueprint?.id === bp.id ? " blueprint-card--active" : "") +
                (isDeprecated ? " blueprint-card--deprecated" : "")
              }
              onClick={() => handleBlueprintClick(bp.id)}
            >
              <div className="blueprint-card-header">
                <div
                  className="blueprint-icon"
                  style={{ backgroundColor: `${iconColor}15`, color: iconColor }}
                >
                  {icon}
                </div>
                <div className="blueprint-meta">
                  <span
                    className="blueprint-category"
                    style={{ color: iconColor }}
                  >
                    {category}
                  </span>
                  {bp.version && (
                    <span className="blueprint-version">v{bp.version}</span>
                  )}
                </div>
              </div>

              <div className="blueprint-title-row">
                <h3 className="blueprint-title">{bp.displayName}</h3>
                {isDeprecated && (
                  <span className="blueprint-deprecated-badge">Deprecated</span>
                )}
              </div>
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

        {blueprints.length > 0 && displayedBlueprints.length === 0 && (
          <div className="blueprint-no-results">
            <p>No templates match your filters</p>
            <button
              onClick={() => {
                setSearchQuery("");
                setProviderFilter("all");
                setCategoryFilter("all");
              }}
              className="blueprint-clear-search"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlueprintsList;
