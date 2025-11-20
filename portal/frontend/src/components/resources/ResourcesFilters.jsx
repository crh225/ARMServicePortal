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
  searchQuery,
  setSearchQuery
}) {
  return (
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
  );
}

export default ResourcesFilters;
