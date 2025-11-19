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
  if (!health) return <span className="health-badge health-badge--unknown">Unknown</span>;

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
function ResourcesTable({ resources, onSelectResource, selectedResource }) {
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
            </tr>
          </thead>
          <tbody>
            {paginatedResources.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-state">
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
                  <td>{resource.cost ? `$${resource.cost}` : "—"}</td>
                  <td>{getHealthDisplay(resource.health)}</td>
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
