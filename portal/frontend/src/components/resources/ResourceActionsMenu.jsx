import React from "react";
import "../../styles/resources/ResourceActionsMenu.css";

/**
 * ResourceActionsMenu component
 * Dropdown menu for resource actions
 */
function ResourceActionsMenu({ resource, onClose, onSelect }) {
  const handleAction = (e, action) => {
    e.stopPropagation();
    onClose();

    switch (action) {
      case "view-details":
        onSelect(resource);
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

  return (
    <div className="actions-dropdown">
      <button
        className="actions-item"
        onClick={(e) => handleAction(e, "view-details")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3C4.5 3 1.5 5.5 0.5 8c1 2.5 4 5 7.5 5s6.5-2.5 7.5-5c-1-2.5-4-5-7.5-5z" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        View Details
      </button>
      <button
        className="actions-item"
        onClick={(e) => handleAction(e, "open-portal")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M12 4L14 4L14 6M14 4L8 10M6 2H3C2.44772 2 2 2.44772 2 3V13C2 13.5523 2.44772 14 3 14H13C13.5523 14 14 13.5523 14 13V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Open in Azure Portal
      </button>
      {resource.pr?.pullRequestUrl && (
        <button
          className="actions-item"
          onClick={(e) => handleAction(e, "view-pr")}
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
        onClick={(e) => handleAction(e, "copy-id")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Copy Resource ID
      </button>
      <button
        className="actions-item"
        onClick={(e) => handleAction(e, "copy-name")}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 11V3C3 2.44772 3.44772 2 4 2H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Copy Name
      </button>
    </div>
  );
}

export default ResourceActionsMenu;
