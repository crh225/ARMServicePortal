import React, { useState } from "react";
import ResourceDetailsTab from "./ResourceDetailsTab";
import ResourceGraphTab from "./ResourceGraphTab";
import ResourceLogsTab from "./ResourceLogsTab";
import "../../styles/ResourceDetailDrawer.css";

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
    <div className="resource-detail">
      {/* Header with resource name */}
      <div className="detail-header">
        <div>
          <h2 className="detail-title">{resource.name}</h2>
          <p className="detail-subtitle">{getResourceTypeDisplay(resource.type)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`detail-tab ${activeTab === "details" ? "detail-tab--active" : ""}`}
          onClick={() => setActiveTab("details")}
        >
          Details
        </button>
        <button
          className={`detail-tab ${activeTab === "graph" ? "detail-tab--active" : ""}`}
          onClick={() => setActiveTab("graph")}
        >
          Graph
        </button>
        <button
          className={`detail-tab ${activeTab === "logs" ? "detail-tab--active" : ""}`}
          onClick={() => setActiveTab("logs")}
        >
          Logs
        </button>
      </div>

      {/* Content */}
      <div className="detail-content">
        {activeTab === "details" && (
          <ResourceDetailsTab resource={resource} />
        )}
        {activeTab === "graph" && (
          <ResourceGraphTab resource={resource} />
        )}
        {activeTab === "logs" && (
          <ResourceLogsTab resource={resource} />
        )}
      </div>
    </div>
  );
}

export default ResourceDetailDrawer;
