import React, { useState, useEffect } from "react";
import { useResources } from "../hooks/useResources";
import ResourcesTable from "./ResourcesTable";
import ResourceDetailDrawer from "./ResourceDetailDrawer";
import EmptyState from "./EmptyState";
import SkeletonLoader from "./SkeletonLoader";
import "../styles/ResourcesPanel.css";

/**
 * Resources Panel - Main container for the Resources tab
 * Shows Azure resources deployed via ARM Portal with GitHub enrichment
 * Backend uses Container App's managed identity for Azure authentication
 */
function ResourcesPanel({ isActive }) {
  const {
    resources,
    loading,
    error,
    fetchResources,
    refreshResources
  } = useResources();

  const [selectedResource, setSelectedResource] = useState(null);
  const [hasLoadedRef, setHasLoadedRef] = useState(false);

  // Fetch resources when tab becomes active
  useEffect(() => {
    if (isActive && !hasLoadedRef) {
      setHasLoadedRef(true);
      fetchResources();
    }
  }, [isActive, hasLoadedRef, fetchResources]);

  const handleRefresh = () => {
    refreshResources();
  };

  const handleSelectResource = (resource) => {
    setSelectedResource(resource);
  };

  const handleCloseDrawer = () => {
    setSelectedResource(null);
  };

  // Loading state
  if (loading && resources.length === 0) {
    return (
      <div className="resources-panel">
        <div className="resources-header">
          <div>
            <h2 className="panel-title">Resources</h2>
            <p className="panel-help">
              View and manage Azure resources deployed through the ARM Portal.
            </p>
          </div>
        </div>
        <SkeletonLoader count={5} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="resources-panel">
        <div className="resources-header">
          <div>
            <h2 className="panel-title">Resources</h2>
            <p className="panel-help">
              View and manage Azure resources deployed through the ARM Portal.
            </p>
          </div>
        </div>
        <div className="error-container">
          <div className="error-message">
            <strong>Error loading resources:</strong>
            <p>{error}</p>
          </div>
          <button className="btn-retry" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (resources.length === 0) {
    return (
      <div className="resources-panel">
        <div className="resources-header">
          <div>
            <h2 className="panel-title">Resources</h2>
            <p className="panel-help">
              View and manage Azure resources deployed through the ARM Portal.
            </p>
          </div>
          <button className="refresh-btn" onClick={handleRefresh} title="Refresh resources">
            ↻
          </button>
        </div>
        <EmptyState
          message="No resources found"
          subMessage="No Azure resources with ARM Portal tags were found in your subscriptions."
        />
      </div>
    );
  }

  // Detail view
  if (selectedResource) {
    return (
      <div className="resources-panel">
        <div className="resources-header">
          <button className="back-btn" onClick={handleCloseDrawer} title="Back to resources">
            ← Back to Resources
          </button>
          <button className="refresh-btn" onClick={handleRefresh} disabled={loading} title="Refresh resources">
            ↻
          </button>
        </div>
        <ResourceDetailDrawer
          resource={selectedResource}
          onClose={handleCloseDrawer}
        />
      </div>
    );
  }

  // Main table view
  return (
    <div className="resources-panel">
      <div className="resources-header">
        <div>
          <h2 className="panel-title">Resources</h2>
          <p className="panel-help">
            View and manage Azure resources deployed through the ARM Portal.
          </p>
        </div>
        <button className="refresh-btn" onClick={handleRefresh} disabled={loading} title="Refresh resources">
          ↻
        </button>
      </div>

      <div className="resources-content">
        <ResourcesTable
          resources={resources}
          onSelectResource={handleSelectResource}
          selectedResource={selectedResource}
        />
      </div>
    </div>
  );
}

export default ResourcesPanel;
