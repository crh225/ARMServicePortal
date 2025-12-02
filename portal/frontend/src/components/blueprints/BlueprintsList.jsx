import { useState, useEffect } from "react";
import EmptyState from "../shared/EmptyState";
import BlueprintsListSkeleton from "./BlueprintsListSkeleton";
import "../../styles/BlueprintsList.css";

// Service-specific icons using official logos/icons
const serviceIcons = {
  // Azure services
  "azure-rg-basic": {
    icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" alt="" width="24" height="24" />,
    color: "#0078d4"
  },
  "azure-storage-basic": {
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="currentColor">
        <path d="M.022 5.37v7.215c0 .2.12.379.3.46l8.36 3.738a.502.502 0 00.635 0l8.36-3.738a.502.502 0 00.3-.46V5.37L9.186 1.254a.568.568 0 00-.372 0L.022 5.37z"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-key-vault-basic": {
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="currentColor">
        <path d="M9 0a4.5 4.5 0 00-1.5 8.745V18h3V8.745A4.5 4.5 0 009 0zm0 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-static-site": {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-frontdoor": {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-cdn": {
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="currentColor">
        <path d="M9 1a8 8 0 108 8 8 8 0 00-8-8zm6.35 5h-2.17a12.58 12.58 0 00-1.11-3.25A6.52 6.52 0 0115.35 6zM9 2.54A11.46 11.46 0 0110.63 6H7.37A11.46 11.46 0 019 2.54zM2.45 10a6.61 6.61 0 010-2h2.49a13.33 13.33 0 000 2zm.2 1h2.17a12.58 12.58 0 001.11 3.25A6.52 6.52 0 012.65 11zM4.82 7H2.65a6.52 6.52 0 013.28-3.25A12.58 12.58 0 004.82 7zM9 15.46A11.46 11.46 0 017.37 12h3.26A11.46 11.46 0 019 15.46zm1.87-4.46H7.13a12.05 12.05 0 010-4h3.74a12.05 12.05 0 010 4zm.2 3.25A12.58 12.58 0 0012.18 11h2.17a6.52 6.52 0 01-3.28 3.25zm1.37-4.25a13.33 13.33 0 000-2h2.49a6.61 6.61 0 010 2z"/>
        <circle cx="14" cy="3" r="2" fill="#50e6ff"/>
        <circle cx="3" cy="12" r="2" fill="#50e6ff"/>
        <circle cx="15" cy="14" r="2" fill="#50e6ff"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-aci": {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 3H3.553C2.696 3 2 3.696 2 4.553v14.894C2 20.304 2.696 21 3.553 21h16.894c.857 0 1.553-.696 1.553-1.553V4.553C22 3.696 21.304 3 20.447 3zM8 17H5v-3h3v3zm0-5H5V9h3v3zm5 5h-3v-3h3v3zm0-5h-3V9h3v3zm5 5h-3v-3h3v3zm0-5h-3V9h3v3z"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-postgres-flexible": {
    icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" alt="" width="24" height="24" />,
    color: "#336791"
  },
  "azure-elastic-managed": {
    icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elasticsearch/elasticsearch-original.svg" alt="" width="24" height="24" />,
    color: "#005571"
  },
  "azure-function": {
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="currentColor">
        <path d="M6.105 7.604l1.912-4.276a.472.472 0 01.429-.28h4.508a.236.236 0 01.2.372L11.1 6.793a.472.472 0 00.4.727h2.651a.239.239 0 01.179.4L5.894 17a.236.236 0 01-.4-.2l1.193-5.4a.472.472 0 00-.461-.577H4.7a.236.236 0 01-.224-.31l1.335-2.73a.472.472 0 01.294-.179z"/>
        <path d="M13.4 1H6.619a.474.474 0 00-.428.274L3.026 8.3a.237.237 0 00.214.339h2.922L5.5 11.283h1.3l-.827 3.77L12.2 7.52H9.522l2.593-4.063h1.107L14.6 1.328A.237.237 0 0014.4 1z" opacity=".8"/>
      </svg>
    ),
    color: "#0062ad"
  },
  "azure-app-configuration": {
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="currentColor">
        <path d="M9 1L1 5v8l8 4 8-4V5L9 1zm0 2.18L14.5 5.5 9 7.82 3.5 5.5 9 3.18zM2 6.27l6 3v6.46l-6-3V6.27zm8 9.46V9.27l6-3v6.46l-6 3z"/>
        <circle cx="9" cy="9" r="2" opacity=".6"/>
      </svg>
    ),
    color: "#0078d4"
  },
  // Crossplane/K8s services
  "xp-application-environment": {
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
