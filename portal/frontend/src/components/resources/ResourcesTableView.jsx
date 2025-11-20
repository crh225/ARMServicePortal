import React from "react";
import ResourceTableRow from "./ResourceTableRow";
import "../../styles/resources/ResourcesTableView.css";

/**
 * ResourcesTableView component
 * Displays the resources table with sortable columns
 */
function ResourcesTableView({
  resources,
  sortColumn,
  sortDirection,
  onSort,
  selectedResource,
  onSelectResource
}) {
  const getSortIcon = (column) => {
    if (sortColumn !== column) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  return (
    <div className="resources-table-container">
      <table className="resources-table">
        <thead>
          <tr>
            <th onClick={() => onSort("name")} className="sortable">
              Name {getSortIcon("name")}
            </th>
            <th onClick={() => onSort("type")} className="sortable">
              Type {getSortIcon("type")}
            </th>
            <th onClick={() => onSort("environment")} className="sortable">
              Environment {getSortIcon("environment")}
            </th>
            <th onClick={() => onSort("blueprintId")} className="sortable">
              Blueprint {getSortIcon("blueprintId")}
            </th>
            <th onClick={() => onSort("ownershipStatus")} className="sortable">
              Ownership {getSortIcon("ownershipStatus")}
            </th>
            <th onClick={() => onSort("prNumber")} className="sortable">
              PR {getSortIcon("prNumber")}
            </th>
            <th>Cost</th>
            <th>Health</th>
            <th className="actions-column">Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.length === 0 ? (
            <tr>
              <td colSpan="9" className="empty-state">
                No resources found matching your filters
              </td>
            </tr>
          ) : (
            resources.map((resource) => (
              <ResourceTableRow
                key={resource.id}
                resource={resource}
                isSelected={selectedResource?.id === resource.id}
                onSelect={onSelectResource}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ResourcesTableView;
