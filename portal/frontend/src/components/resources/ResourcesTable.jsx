import { useState, useMemo } from "react";
import CostSummaryCard from "./CostSummaryCard";
import ResourcesFilters from "./ResourcesFilters";
import ResourcesTableView from "./ResourcesTableView";
import ResourcesPagination from "./ResourcesPagination";
import { getResourceTypeDisplay } from "./helpers.jsx";
import "../../styles/ResourcesTable.css";

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

  // Calculate cost summary with breakdowns
  const costSummary = useMemo(() => {
    let totalCost = 0;
    let resourcesWithCost = 0;
    let resourcesNoCost = 0;
    const costByEnvironment = {};
    const costByBlueprint = {};
    const costByOwnership = {};
    const costByProduct = {};
    let highestCostResource = null;
    let highestCost = 0;

    filteredResources.forEach(resource => {
      if (resource.cost !== null && resource.cost !== undefined) {
        totalCost += resource.cost;
        resourcesWithCost++;

        // Track highest cost resource
        if (resource.cost > highestCost) {
          highestCost = resource.cost;
          highestCostResource = resource;
        }

        // Breakdown by environment
        const env = resource.environment || "unknown";
        costByEnvironment[env] = (costByEnvironment[env] || 0) + resource.cost;

        // Breakdown by blueprint
        const bp = resource.blueprintId || "unknown";
        costByBlueprint[bp] = (costByBlueprint[bp] || 0) + resource.cost;

        // Breakdown by ownership status
        const status = resource.ownershipStatus || "unknown";
        costByOwnership[status] = (costByOwnership[status] || 0) + resource.cost;

        // Breakdown by product (resource type)
        const product = getResourceTypeDisplay(resource.type);
        costByProduct[product] = (costByProduct[product] || 0) + resource.cost;
      } else {
        resourcesNoCost++;
      }
    });

    // Calculate average cost
    const avgCost = resourcesWithCost > 0 ? totalCost / resourcesWithCost : 0;

    // Sort breakdowns
    const topEnvironments = Object.entries(costByEnvironment)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topBlueprints = Object.entries(costByBlueprint)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const topProducts = Object.entries(costByProduct)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);

    return {
      totalCost,
      avgCost,
      resourcesWithCost,
      resourcesNoCost,
      hasAnyCost: resourcesWithCost > 0,
      highestCostResource,
      topEnvironments,
      topBlueprints,
      topProducts,
      costByOwnership
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="resources-container">
      <ResourcesFilters
        filterOptions={filterOptions}
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
