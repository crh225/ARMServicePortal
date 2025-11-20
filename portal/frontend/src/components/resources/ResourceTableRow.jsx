import React, { useState, useEffect } from "react";
import { getResourceTypeDisplay, getStatusBadgeClass, getStatusDisplay, getHealthDisplay } from "./helpers";
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
