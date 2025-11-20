import React, { useState, useEffect } from "react";
import { getResourceTypeDisplay, getResourceTypeIcon, getStatusBadgeClass, getStatusDisplay, getHealthDisplay } from "./helpers";
import ResourceActionsMenu from "./ResourceActionsMenu";
import "../../styles/resources/ResourceTableRow.css";

/**
 * ResourceTableRow component
 * Displays a single resource row in the table
 */
function ResourceTableRow({ resource, isSelected, onSelect }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsMenuOpen(false);
    if (isMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isMenuOpen]);

  const toggleMenu = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <tr
      onClick={() => onSelect(resource)}
      className={isSelected ? "selected" : ""}
    >
      <td className="resource-name">{resource.name}</td>
      <td className="resource-type">
        <span className="resource-type-container">
          {getResourceTypeIcon(resource.type)}
          {getResourceTypeDisplay(resource.type)}
        </span>
      </td>
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
        {resource.cost !== null && resource.cost !== undefined ? (
          <span className="cost-value">
            ${resource.cost.toFixed(2)}
            {resource.cost > 10 && (
              <span className="cost-warning" title="High cost resource">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
              </span>
            )}
          </span>
        ) : (
          "—"
        )}
      </td>
      <td>{getHealthDisplay(resource.health)}</td>
      <td className="actions-cell">
        <div className="actions-menu-container">
          <button
            className="actions-button"
            onClick={toggleMenu}
            aria-label="Resource actions"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="8" cy="3" r="1.5" />
              <circle cx="8" cy="8" r="1.5" />
              <circle cx="8" cy="13" r="1.5" />
            </svg>
          </button>
          {isMenuOpen && (
            <ResourceActionsMenu
              resource={resource}
              onClose={() => setIsMenuOpen(false)}
              onSelect={onSelect}
            />
          )}
        </div>
      </td>
    </tr>
  );
}

export default ResourceTableRow;
