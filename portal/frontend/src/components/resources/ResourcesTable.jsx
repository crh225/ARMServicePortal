import { useState, useMemo, useEffect } from "react";
import CostSummaryCard from "./CostSummaryCard";
import ResourcesFilters from "./ResourcesFilters";
import ResourcesTableView from "./ResourcesTableView";
import ResourcesPagination from "./ResourcesPagination";
import { useCostSummary } from "../../hooks/useCostSummary";
import "../../styles/ResourcesTable.css";

/**
 * ResourcesTable component with filters and sorting
 */
function ResourcesTable({ resources, subscriptions, onSelectResource, selectedResource, costsLoading, onFilteredResourcesChange }) {
  // Filter states
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
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
    const subscriptionIds = new Set();
    const environments = new Set();
    const blueprints = new Set();
    const owners = new Set();

    resources.forEach(resource => {
      if (resource.subscriptionId) subscriptionIds.add(resource.subscriptionId);
      if (resource.environment) environments.add(resource.environment);
      if (resource.blueprintId) blueprints.add(resource.blueprintId);
      if (resource.owner) owners.add(resource.owner);
    });

    // Map subscription IDs to their names
    const subscriptionOptions = Array.from(subscriptionIds).map(id => {
      const subscription = subscriptions.find(sub => sub.id === id);
      return {
        id,
        name: subscription ? subscription.name : id
      };
    }).sort((a, b) => a.name.localeCompare(b.name));

    return {
      subscriptions: subscriptionOptions,
      environments: Array.from(environments).sort(),
      blueprints: Array.from(blueprints).sort(),
      owners: Array.from(owners).sort()
    };
  }, [resources, subscriptions]);

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    let filtered = resources;

    // Apply filters
    if (subscriptionFilter !== "all") {
      filtered = filtered.filter(r => r.subscriptionId === subscriptionFilter);
    }
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

    // Apply sorting (create a copy to avoid mutating the original array)
    return [...filtered].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      // Handle null/undefined - sort nulls to end
      const aIsNull = aVal == null || aVal === "";
      const bIsNull = bVal == null || bVal === "";

      if (aIsNull && bIsNull) return 0;
      if (aIsNull) return sortDirection === "asc" ? 1 : -1;
      if (bIsNull) return sortDirection === "asc" ? -1 : 1;

      // Numeric comparison for number fields
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      if (typeof bVal === "string") {
        bVal = bVal.toLowerCase();
        aVal = String(aVal).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [resources, subscriptionFilter, environmentFilter, blueprintFilter, ownerFilter, ownershipFilter, searchQuery, sortColumn, sortDirection]);

  // Calculate cost summary using custom hook
  const costSummary = useCostSummary(filteredResources);

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
  }, [subscriptionFilter, environmentFilter, blueprintFilter, ownerFilter, ownershipFilter, searchQuery]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Notify parent component of filtered resources changes
  useEffect(() => {
    if (onFilteredResourcesChange) {
      onFilteredResourcesChange(filteredResources);
    }
  }, [filteredResources, onFilteredResourcesChange]);

  return (
    <div className="resources-container">
      <ResourcesFilters
        filterOptions={filterOptions}
        subscriptionFilter={subscriptionFilter}
        setSubscriptionFilter={setSubscriptionFilter}
        environmentFilter={environmentFilter}
        setEnvironmentFilter={setEnvironmentFilter}
        blueprintFilter={blueprintFilter}
        setBlueprintFilter={setBlueprintFilter}
        ownerFilter={ownerFilter}
        setOwnerFilter={setOwnerFilter}
        ownershipFilter={ownershipFilter}
        setOwnershipFilter={setOwnershipFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      <CostSummaryCard costSummary={costSummary} costsLoading={costsLoading} />

      <ResourcesPagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredResources.length}
        onPageChange={handlePageChange}
      />

      <ResourcesTableView
        resources={paginatedResources}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        selectedResource={selectedResource}
        onSelectResource={onSelectResource}
      />

      <ResourcesPagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={filteredResources.length}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default ResourcesTable;
