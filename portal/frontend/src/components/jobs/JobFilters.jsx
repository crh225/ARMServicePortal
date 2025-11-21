import React from "react";

/**
 * Job filtering controls component
 * Provides status, environment, blueprint, and job ID filters
 */
function JobFilters({
  statusFilter,
  onStatusFilterChange,
  environmentFilter,
  onEnvironmentFilterChange,
  blueprintFilter,
  onBlueprintFilterChange,
  jobIdFilter,
  onJobIdFilterChange,
  environments,
  blueprints
}) {
  const hasActiveFilters =
    statusFilter !== "all" ||
    environmentFilter !== "all" ||
    blueprintFilter !== "all" ||
    jobIdFilter !== "";

  const handleClearFilters = () => {
    onStatusFilterChange("all");
    onEnvironmentFilterChange("all");
    onBlueprintFilterChange("all");
    onJobIdFilterChange("");
  };

  return (
    <div className="job-filters">
      <div className="job-filters-row">
        <input
          type="text"
          className="job-id-input"
          placeholder="Job ID..."
          value={jobIdFilter}
          onChange={(e) => onJobIdFilterChange(e.target.value)}
        />
        <div className="filter-pill-group">
          <button
            className={`filter-pill ${statusFilter === "all" ? "filter-pill--active" : ""}`}
            onClick={() => onStatusFilterChange("all")}
            disabled={!!jobIdFilter}
          >
            All
          </button>
          <button
            className={`filter-pill ${statusFilter === "merged" ? "filter-pill--active" : ""}`}
            onClick={() => onStatusFilterChange("merged")}
            disabled={!!jobIdFilter}
          >
            Merged
          </button>
          <button
            className={`filter-pill ${statusFilter === "open" ? "filter-pill--active" : ""}`}
            onClick={() => onStatusFilterChange("open")}
            disabled={!!jobIdFilter}
          >
            Open
          </button>
          <button
            className={`filter-pill ${statusFilter === "closed" ? "filter-pill--active" : ""}`}
            onClick={() => onStatusFilterChange("closed")}
            disabled={!!jobIdFilter}
          >
            Closed
          </button>
        </div>
      </div>

      <div className="job-filters-row">
        <select
          className="filter-select"
          value={environmentFilter}
          onChange={(e) => onEnvironmentFilterChange(e.target.value)}
          disabled={!!jobIdFilter}
        >
          <option value="all">All Environments</option>
          {environments.map(env => (
            <option key={env} value={env}>{env}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={blueprintFilter}
          onChange={(e) => onBlueprintFilterChange(e.target.value)}
          disabled={!!jobIdFilter}
        >
          <option value="all">All Blueprints</option>
          {blueprints.map(bp => (
            <option key={bp} value={bp}>{bp}</option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            className="filter-clear-btn"
            onClick={handleClearFilters}
            title="Clear all filters"
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default JobFilters;
