import { useState, useEffect } from "react";
import EmptyState from "../shared/EmptyState";
import BlueprintsListSkeleton from "./BlueprintsListSkeleton";
import "../../styles/BlueprintsList.css";

// Service-specific icons styled in Azure's visual language
// Azure uses a consistent design: blue (#0078D4) primary, cyan (#50E6FF) highlight, gold (#FFB900) accent
// Each icon is designed to visually represent the service type while maintaining Azure branding
const serviceIcons = {
  // Azure services - using official Microsoft icons
  "azure-rg-basic": {
    icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" alt="" width="24" height="24" />,
    color: "#0078d4"
  },
  "azure-storage-basic": {
    // Official Azure Storage Account icon
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M.5 5.5v7a2 2 0 002 2h13a2 2 0 002-2v-7H.5z" fill="#0078D4"/>
        <path d="M17.5 5.5H.5v-2a2 2 0 012-2h13a2 2 0 012 2v2z" fill="#50E6FF"/>
        <path d="M3.75 7.5a.75.75 0 100 1.5h2.5a.75.75 0 000-1.5h-2.5zM3 11.25a.75.75 0 01.75-.75h6.5a.75.75 0 010 1.5h-6.5a.75.75 0 01-.75-.75z" fill="#fff"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-key-vault-basic": {
    // Official Azure Key Vault icon
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 1L1 5v8l8 4 8-4V5L9 1z" fill="#0078D4"/>
        <path d="M9 1v8l8-4-8-4z" fill="#50E6FF"/>
        <path d="M9 9v8l8-4V5L9 9z" fill="#0078D4" fillOpacity=".8"/>
        <circle cx="9" cy="9" r="2.5" fill="#FFB900"/>
        <path d="M9 10.5v3" stroke="#FFB900" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-static-site": {
    // Official Azure Static Web Apps icon
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="2" width="16" height="14" rx="2" fill="#0078D4"/>
        <rect x="2.5" y="3.5" width="13" height="8" rx="1" fill="#fff"/>
        <path d="M6 8l2.5 2L11 8" stroke="#0078D4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="4" y="13" width="4" height="1.5" rx=".5" fill="#50E6FF"/>
        <rect x="10" y="13" width="4" height="1.5" rx=".5" fill="#50E6FF"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-frontdoor": {
    // Official Azure Front Door icon
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 1L2 5v8l7 4 7-4V5L9 1z" fill="#0078D4"/>
        <path d="M9 1l7 4-7 4-7-4 7-4z" fill="#50E6FF"/>
        <path d="M9 9v8l7-4V5L9 9z" fill="#0078D4" fillOpacity=".7"/>
        <circle cx="5" cy="7" r="1.5" fill="#fff"/>
        <circle cx="9" cy="9" r="1.5" fill="#fff"/>
        <circle cx="13" cy="7" r="1.5" fill="#fff"/>
        <path d="M5 7l4 2m4-2l-4 2" stroke="#fff" strokeWidth=".75"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-cdn": {
    // Official Azure CDN icon
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="9" cy="9" r="8" fill="#0078D4"/>
        <ellipse cx="9" cy="9" rx="3" ry="8" fill="#50E6FF"/>
        <path d="M1.5 9h15M2 5.5h14M2 12.5h14" stroke="#fff" strokeWidth=".75"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-aci": {
    // Official Azure Container Instances icon
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" fill="#0078D4"/>
        <path d="M5 6h3v3H5V6z" fill="#50E6FF"/>
        <path d="M10 6h3v3h-3V6z" fill="#50E6FF"/>
        <path d="M5 11h3v3H5v-3z" fill="#50E6FF"/>
        <path d="M10 11h3v3h-3v-3z" fill="#fff" fillOpacity=".5"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-container-app": {
    // Azure Container Apps icon - modern serverless containers
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" fill="#0078D4"/>
        <path d="M5 5h3v3H5V5z" fill="#50E6FF"/>
        <path d="M10 5h3v3h-3V5z" fill="#50E6FF"/>
        <path d="M5 10h3v3H5v-3z" fill="#50E6FF"/>
        <path d="M10 10h3v3h-3v-3z" fill="#50E6FF"/>
        <circle cx="13" cy="13" r="4" fill="#fff"/>
        <path d="M11 13h4M13 11v4" stroke="#0078D4" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-postgres-flexible": {
    // Official Azure Database for PostgreSQL icon
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="9" cy="4" rx="7" ry="2.5" fill="#0078D4"/>
        <path d="M2 4v10c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V4" stroke="#0078D4" strokeWidth="2"/>
        <ellipse cx="9" cy="9" rx="7" ry="2.5" fill="#50E6FF" fillOpacity=".5"/>
        <ellipse cx="9" cy="14" rx="7" ry="2.5" fill="#50E6FF" fillOpacity=".3"/>
        <path d="M6 7.5l2 1.5 4-3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    color: "#336791"
  },
  "azure-elastic-managed": {
    // Elasticsearch icon (partner service)
    icon: <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/elasticsearch/elasticsearch-original.svg" alt="" width="24" height="24" />,
    color: "#005571"
  },
  "azure-function": {
    // Official Azure Functions icon
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 1L2 5v8l7 4 7-4V5L9 1z" fill="#0078D4"/>
        <path d="M9 1l7 4-7 4-7-4 7-4z" fill="#50E6FF"/>
        <path d="M6.5 7L9 9l-1 4 3-3-2.5-2L10 4l-3.5 3z" fill="#FFB900"/>
      </svg>
    ),
    color: "#0062ad"
  },
  "azure-app-configuration": {
    // Official Azure App Configuration icon
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="14" height="14" rx="2" fill="#0078D4"/>
        <path d="M5 6h8M5 9h8M5 12h5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="13" cy="12" r="1.5" fill="#50E6FF"/>
      </svg>
    ),
    color: "#0078d4"
  },
  "azure-ml-workspace": {
    // Official Azure Machine Learning icon
    icon: (
      <svg width="24" height="24" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 1L2 5v8l7 4 7-4V5L9 1z" fill="#0078D4"/>
        <path d="M9 1l7 4-7 4-7-4 7-4z" fill="#50E6FF"/>
        <path d="M9 9v8l7-4V5L9 9z" fill="#0078D4" fillOpacity=".7"/>
        <circle cx="6" cy="8" r="1.25" fill="#fff"/>
        <circle cx="12" cy="8" r="1.25" fill="#fff"/>
        <circle cx="9" cy="11" r="1.25" fill="#fff"/>
        <path d="M6 8l3 3m3-3l-3 3" stroke="#fff" strokeWidth=".75"/>
      </svg>
    ),
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
