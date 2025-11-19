import React, { useState } from "react";
import { OwnershipStatus } from "../hooks/useResources";
import ResourceGraph from "./ResourceGraph";
import "../styles/ResourceDetailDrawer.css";

/**
 * Get Azure Portal URL for a resource
 */
function getAzurePortalUrl(resource) {
  return `https://portal.azure.com/#@/resource${resource.id}`;
}

/**
 * Get display-friendly resource type
 */
function getResourceTypeDisplay(type) {
  if (!type) return "Unknown";
  const parts = type.split("/");
  return parts[parts.length - 1];
}

/**
 * Resource Detail Drawer with tabs
 */
function ResourceDetailDrawer({ resource, onClose }) {
  const [activeTab, setActiveTab] = useState("details");

  if (!resource) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title">{resource.name}</h2>
            <p className="drawer-subtitle">{getResourceTypeDisplay(resource.type)}</p>
          </div>
          <button className="drawer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="drawer-tabs">
          <button
            className={`drawer-tab ${activeTab === "details" ? "drawer-tab--active" : ""}`}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={`drawer-tab ${activeTab === "graph" ? "drawer-tab--active" : ""}`}
            onClick={() => setActiveTab("graph")}
          >
            Graph
          </button>
        </div>

        {/* Content */}
        <div className="drawer-content">
          {activeTab === "details" && (
            <DetailsTab resource={resource} />
          )}
          {activeTab === "graph" && (
            <GraphTab resource={resource} />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Details Tab Content
 */
function DetailsTab({ resource }) {
  return (
    <div className="drawer-sections">
      {/* General Info */}
      <div className="drawer-section">
        <h3 className="section-title">General Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Name</span>
            <span className="info-value">{resource.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Type</span>
            <span className="info-value">{resource.type}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Location</span>
            <span className="info-value">{resource.location}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Resource Group</span>
            <span className="info-value">{resource.resourceGroup}</span>
          </div>
        </div>
      </div>

      {/* Azure IDs */}
      <div className="drawer-section">
        <h3 className="section-title">Azure Resource Identifiers</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Resource ID</span>
            <code className="info-code">{resource.id}</code>
          </div>
          <div className="info-item">
            <span className="info-label">Subscription ID</span>
            <code className="info-code">{resource.subscriptionId}</code>
          </div>
        </div>
      </div>

      {/* Portal Info */}
      <div className="drawer-section">
        <h3 className="section-title">ARM Portal Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Environment</span>
            <span className="info-value">{resource.environment || "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Blueprint</span>
            <span className="info-value">{resource.blueprintId || "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Owner</span>
            <span className="info-value">{resource.owner || "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Request ID</span>
            <span className="info-value">{resource.requestId || "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Ownership Status</span>
            <span className="info-value">
              <StatusBadge status={resource.ownershipStatus} />
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {Object.keys(resource.tags).length > 0 && (
        <div className="drawer-section">
          <h3 className="section-title">Tags</h3>
          <div className="tags-list">
            {Object.entries(resource.tags).map(([key, value]) => (
              <div key={key} className="tag-item">
                <span className="tag-key">{key}</span>
                <span className="tag-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PR Info */}
      {resource.pr && (
        <div className="drawer-section">
          <h3 className="section-title">Pull Request</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">PR Number</span>
              <a
                href={resource.pr.url}
                target="_blank"
                rel="noreferrer"
                className="info-link"
              >
                #{resource.prNumber}
              </a>
            </div>
            <div className="info-item">
              <span className="info-label">PR Title</span>
              <span className="info-value">{resource.pr.title}</span>
            </div>
            <div className="info-item">
              <span className="info-label">PR Status</span>
              <span className="info-value">
                {resource.pr.merged ? "Merged" : resource.pr.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cost (Placeholder) */}
      <div className="drawer-section">
        <h3 className="section-title">Cost</h3>
        <p className="placeholder-text">Cost tracking coming soon...</p>
      </div>

      {/* Health (Placeholder) */}
      <div className="drawer-section">
        <h3 className="section-title">Health</h3>
        <p className="placeholder-text">Health monitoring coming soon...</p>
      </div>

      {/* Actions */}
      <div className="drawer-section">
        <h3 className="section-title">Actions</h3>
        <div className="action-buttons">
          <a
            href={getAzurePortalUrl(resource)}
            target="_blank"
            rel="noreferrer"
            className="action-btn action-btn--primary"
          >
            Open in Azure Portal
          </a>
          {resource.pr && (
            <a
              href={resource.pr.url}
              target="_blank"
              rel="noreferrer"
              className="action-btn action-btn--secondary"
            >
              Open PR in GitHub
            </a>
          )}
          <button
            className="action-btn action-btn--secondary"
            disabled
            title="Cleanup PR generation coming soon"
          >
            Generate Cleanup PR (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Graph Tab Content - Force-directed graph visualization
 */
function GraphTab({ resource }) {
  return (
    <div className="drawer-sections">
      <div className="drawer-section">
        <h3 className="section-title">Resource Graph</h3>
        <ResourceGraph resource={resource} />
      </div>
    </div>
  );
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }) {
  let className = "status-badge";
  let text = "";

  switch (status) {
    case OwnershipStatus.MANAGED:
      className += " status-badge--managed";
      text = "Managed";
      break;
    case OwnershipStatus.STALE:
      className += " status-badge--stale";
      text = "Stale";
      break;
    case OwnershipStatus.ORPHAN:
      className += " status-badge--orphan";
      text = "Orphan";
      break;
    case OwnershipStatus.UNMANAGED:
      className += " status-badge--unmanaged";
      text = "Unmanaged";
      break;
    default:
      text = "Unknown";
  }

  return <span className={className}>{text}</span>;
}

export default ResourceDetailDrawer;
