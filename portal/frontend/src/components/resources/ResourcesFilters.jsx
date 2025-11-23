import React from "react";
import { OwnershipStatus } from "../../hooks/useResources";
import "../../styles/resources/ResourcesFilters.css";

/**
 * ResourcesFilters component
 * Filter bar for resources
 */
function ResourcesFilters({
  filterOptions,
  environmentFilter,
  setEnvironmentFilter,
  blueprintFilter,
  setBlueprintFilter,
  ownerFilter,
  setOwnerFilter,
  ownershipFilter,
  setOwnershipFilter,
  subscriptionFilter,
  setSubscriptionFilter,
  searchQuery,
  setSearchQuery
}) {
  const hasActiveFilters =
    environmentFilter !== "all" ||
    blueprintFilter !== "all" ||
    ownerFilter !== "all" ||
    ownershipFilter !== "all" ||
    subscriptionFilter !== "all" ||
    searchQuery !== "";

  const handleClearFilters = () => {
    setEnvironmentFilter("all");
    setBlueprintFilter("all");
    setOwnerFilter("all");
    setOwnershipFilter("all");
    setSubscriptionFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="resources-filters">
      <select
        className="filter-select"
        value={subscriptionFilter}
        onChange={(e) => setSubscriptionFilter(e.target.value)}
      >
        <option value="all">All Subscriptions</option>
        {filterOptions.subscriptions.map(sub => (
          <option key={sub} value={sub}>{sub}</option>
        ))}
      </select>

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
  );
}

export default ResourcesFilters;
