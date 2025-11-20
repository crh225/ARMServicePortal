import React, { useState, useMemo } from "react";
import { OwnershipStatus } from "../hooks/useResources";
import "../styles/ResourcesTable.css";

/**
 * Get display-friendly resource type
 */
function getResourceTypeDisplay(type) {
  if (!type) return "Unknown";
  const parts = type.split("/");
  return parts[parts.length - 1];
}

/**
 * Get status badge class
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case OwnershipStatus.MANAGED:
      return "status-badge status-badge--managed";
    case OwnershipStatus.PERMANENT:
      return "status-badge status-badge--permanent";
    case OwnershipStatus.STALE:
      return "status-badge status-badge--stale";
    case OwnershipStatus.ORPHAN:
      return "status-badge status-badge--orphan";
    case OwnershipStatus.UNMANAGED:
      return "status-badge status-badge--unmanaged";
    default:
      return "status-badge";
  }
}

/**
 * Get status display text
 */
function getStatusDisplay(status) {
  switch (status) {
    case OwnershipStatus.MANAGED:
      return "Managed";
    case OwnershipStatus.PERMANENT:
      return "Permanent";
    case OwnershipStatus.STALE:
      return "Stale";
    case OwnershipStatus.ORPHAN:
      return "Orphan";
    case OwnershipStatus.UNMANAGED:
      return "Unmanaged";
    default:
      return "Unknown";
  }
}

/**
 * Get health status display with badge
 */
function getHealthDisplay(health) {
  if (!health) return "—";

  // Normalize health status to lowercase for comparison
  const status = health.toLowerCase();

  if (status === "succeeded") {
    return <span className="health-badge health-badge--healthy">Healthy</span>;
  } else if (status === "failed") {
    return <span className="health-badge health-badge--unhealthy">Failed</span>;
  } else if (status === "running" || status === "updating" || status === "provisioning") {
    return <span className="health-badge health-badge--provisioning">Provisioning</span>;
  } else {
    return <span className="health-badge health-badge--unknown">{health}</span>;
  }
}

/**
 * ResourcesTable component with filters and sorting
 */
function ResourcesTable({ resources, onSelectResource, selectedResource, costsLoading }) {
  // Filter states
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [blueprintFilter, setBlueprintFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [ownershipFilter, setOwnershipFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Sort state
  const [sortColumn, setSortColumn] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Actions menu state
  const [openMenuId, setOpenMenuId] = useState(null);

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    const environments = new Set();
    const blueprints = new Set();
    const owners = new Set();

    resources.forEach(resource => {
      if (resource.environment) environments.add(resource.environment);
      if (resource.blueprintId) blueprints.add(resource.blueprintId);
      if (resource.owner) owners.add(resource.owner);
    });

    return {
      environments: Array.from(environments).sort(),
      blueprints: Array.from(blueprints).sort(),
      owners: Array.from(owners).sort()
    };
  }, [resources]);

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    let filtered = resources;

    // Apply filters
    if (environmentFilter !== "all") {
      filtered = filtered.filter(r => r.environment === environmentFilter);
    }
    if (blueprintFilter !== "all") {
      filtered = filtered.filter(r => r.blueprintId === blueprintFilter);
    }
    if (ownerFilter !== "all") {
      filtered = filtered.filter(r => r.owner === ownerFilter);
    }
    if (ownershipFilter !== "all") {
      filtered = filtered.filter(r => r.ownershipStatus === ownershipFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.type.toLowerCase().includes(query) ||
        r.resourceGroup?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle null/undefined
      if (aVal == null) aVal = "";
      if (bVal == null) bVal = "";

      // String comparison
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [resources, environmentFilter, blueprintFilter, ownerFilter, ownershipFilter, searchQuery, sortColumn, sortDirection]);

  // Calculate cost summary
  const costSummary = useMemo(() => {
    let totalCost = 0;
    let resourcesWithCost = 0;
    let resourcesNoCost = 0;

    filteredResources.forEach(resource => {
      if (resource.cost !== null && resource.cost !== undefined) {
        totalCost += resource.cost;
        resourcesWithCost++;
      } else {
        resourcesNoCost++;
      }
    });

    return {
      totalCost,
      resourcesWithCost,
      resourcesNoCost,
      hasAnyCost: resourcesWithCost > 0
    };
  }, [filteredResources]);

  // Paginate resources
  const paginatedResources = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredResources.slice(startIndex, endIndex);
  }, [filteredResources, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredResources.length / itemsPerPage);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [environmentFilter, blueprintFilter, ownerFilter, ownershipFilter, searchQuery]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  const toggleActionsMenu = (e, resourceId) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === resourceId ? null : resourceId);
  };

  const handleAction = (e, action, resource) => {
    e.stopPropagation();
    setOpenMenuId(null);

    switch (action) {
      case "view-details":
        onSelectResource(resource);
        break;
      case "open-portal":
        window.open(`https://portal.azure.com/#@/resource${resource.id}`, "_blank");
        break;
      case "view-pr":
        if (resource.pr?.pullRequestUrl) {
          window.open(resource.pr.pullRequestUrl, "_blank");
        }
        break;
      case "copy-id":
        navigator.clipboard.writeText(resource.id);
        break;
      case "copy-name":
        navigator.clipboard.writeText(resource.name);
        break;
      default:
        break;
    }
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [openMenuId]);

  return (
    <div className="resources-container">
      {/* Filters Bar */}
      <div className="resources-filters">
        <select
          className="filter-select"
          value={environmentFilter}
          onChange={(e) => setEnvironmentFilter(e.target.value)}
        >
          <option value="all">All Environments</option>
          {filterOptions.environments.map(env => (
            <option key={env} value={env}>{env}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={blueprintFilter}
          onChange={(e) => setBlueprintFilter(e.target.value)}
        >
          <option value="all">All Blueprints</option>
          {filterOptions.blueprints.map(bp => (
            <option key={bp} value={bp}>{bp}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
        >
          <option value="all">All Owners</option>
          {filterOptions.owners.map(owner => (
            <option key={owner} value={owner}>{owner}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={ownershipFilter}
          onChange={(e) => setOwnershipFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value={OwnershipStatus.MANAGED}>Managed</option>
          <option value={OwnershipStatus.PERMANENT}>Permanent</option>
          <option value={OwnershipStatus.STALE}>Stale</option>
          <option value={OwnershipStatus.ORPHAN}>Orphan</option>
          <option value={OwnershipStatus.UNMANAGED}>Unmanaged</option>
        </select>

        <input
          type="text"
          className="filter-search"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Cost Summary */}
      {costsLoading ? (
        <div className="cost-summary">
          <div className="cost-summary-card cost-summary-card--loading">
            <div className="cost-summary-main">
              <div className="cost-summary-label">Total Monthly Cost</div>
              <div className="cost-summary-skeleton">
                <div className="skeleton-bar skeleton-bar--large"></div>
              </div>
            </div>
            <div className="cost-summary-details">
              <div className="skeleton-bar skeleton-bar--small"></div>
              <div className="skeleton-bar skeleton-bar--small"></div>
            </div>
          </div>
        </div>
      ) : costSummary.hasAnyCost ? (
        <div className="cost-summary">
          <div className="cost-summary-card">
            <div className="cost-summary-main">
              <div className="cost-summary-label">Total Monthly Cost</div>
              <div className="cost-summary-amount">${costSummary.totalCost.toFixed(2)}</div>
            </div>
            <div className="cost-summary-details">
              <span className="cost-summary-detail">
                {costSummary.resourcesWithCost} resource{costSummary.resourcesWithCost !== 1 ? 's' : ''} with cost
              </span>
              {costSummary.resourcesNoCost > 0 && (
                <span className="cost-summary-detail cost-summary-detail--muted">
                  {costSummary.resourcesNoCost} without cost data
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Results Count and Pagination Info */}
      <div className="resources-count">
        Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredResources.length)} of {filteredResources.length} resources
      </div>

      {/* Table */}
      <div className="resources-table-container">
        <table className="resources-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("name")} className="sortable">
                Name {getSortIcon("name")}
              </th>
              <th onClick={() => handleSort("type")} className="sortable">
                Type {getSortIcon("type")}
              </th>
              <th onClick={() => handleSort("environment")} className="sortable">
                Environment {getSortIcon("environment")}
              </th>
              <th onClick={() => handleSort("blueprintId")} className="sortable">
                Blueprint {getSortIcon("blueprintId")}
              </th>
              <th onClick={() => handleSort("ownershipStatus")} className="sortable">
                Ownership {getSortIcon("ownershipStatus")}
              </th>
              <th onClick={() => handleSort("prNumber")} className="sortable">
                PR {getSortIcon("prNumber")}
              </th>
              <th>Cost</th>
              <th>Health</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedResources.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  No resources found matching your filters
                </td>
              </tr>
            ) : (
              paginatedResources.map((resource) => (
                <tr
                  key={resource.id}
                  onClick={() => onSelectResource(resource)}
                  className={selectedResource?.id === resource.id ? "selected" : ""}
                >
                  <td className="resource-name">{resource.name}</td>
                  <td className="resource-type">{getResourceTypeDisplay(resource.type)}</td>
                  <td>{resource.environment || "—"}</td>
                  <td>{resource.blueprintId || "—"}</td>
                  <td>
                    <span className={getStatusBadgeClass(resource.ownershipStatus)}>
                      {getStatusDisplay(resource.ownershipStatus)}
                    </span>
                  </td>
                  <td>
                    {resource.prNumber ? (
                      <a
                        href={resource.pr?.pullRequestUrl || `https://github.com/crh225/ARMServicePortal/pull/${resource.prNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className="pr-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        #{resource.prNumber}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    {resource.cost !== null && resource.cost !== undefined
                      ? `$${resource.cost.toFixed(2)}`
                      : "—"}
                  </td>
                  <td>{getHealthDisplay(resource.health)}</td>
                  <td className="actions-cell">
                    <div className="actions-menu-container">
                      <button
                        className="actions-button"
                        onClick={(e) => toggleActionsMenu(e, resource.id)}
                        aria-label="Resource actions"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="currentColor"
                        >
                          <circle cx="8" cy="3" r="1.5" />
                          <circle cx="8" cy="8" r="1.5" />
                          <circle cx="8" cy="13" r="1.5" />
                        </svg>
                      </button>
                      {openMenuId === resource.id && (
                        <div className="actions-dropdown">
                          <button
                            className="actions-item"
                            onClick={(e) => handleAction(e, "view-details", resource)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M8 3C4.5 3 1.5 5.5 0.5 8c1 2.5 4 5 7.5 5s6.5-2.5 7.5-5c-1-2.5-4-5-7.5-5z" stroke="currentColor" strokeWidth="1.5" />
                              <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            View Details
                          </button>
                          <button
                            className="actions-item"
                            onClick={(e) => handleAction(e, "open-portal", resource)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M12 4L14 4L14 6M14 4L8 10M6 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            Open in Azure Portal
                          </button>
                          {resource.pr?.pullRequestUrl && (
                            <button
                              className="actions-item"
                              onClick={(e) => handleAction(e, "view-pr", resource)}
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M5 3.5C5 2.67157 5.67157 2 6.5 2C7.32843 2 8 2.67157 8 3.5V6H10.5C11.3284 6 12 6.67157 12 7.5C12 8.32843 11.3284 9 10.5 9H8V12.5C8 13.3284 7.32843 14 6.5 14C5.67157 14 5 13.3284 5 12.5V9H2.5C1.67157 9 1 8.32843 1 7.5C1 6.67157 1.67157 6 2.5 6H5V3.5Z" stroke="currentColor" strokeWidth="1.5" />
                              </svg>
                              View Pull Request
                            </button>
                          )}
                          <div className="actions-divider"></div>
                          <button
                            className="actions-item"
                            onClick={(e) => handleAction(e, "copy-id", resource)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            Copy Resource ID
                          </button>
                          <button
                            className="actions-item"
                            onClick={(e) => handleAction(e, "copy-name", resource)}
                          >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                            Copy Name
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="nav-pill"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Prev
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="nav-pill"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default ResourcesTable;
