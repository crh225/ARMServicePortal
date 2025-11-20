import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useResources } from "../../hooks/useResources";
import ResourcesTable from "./ResourcesTable";
import ResourceDetailDrawer from "./ResourceDetailDrawer";
import EmptyState from "../shared/EmptyState";
import SkeletonLoader from "../shared/SkeletonLoader";
import { exportResourcesToCSV } from "../../utils/csvExport";
import "../../styles/ResourcesPanel.css";

/**
 * Resources Panel - Main container for the Resources tab
 * Shows Azure resources deployed via ARM Portal with GitHub enrichment
 * Backend uses Container App's managed identity for Azure authentication
 */
function ResourcesPanel({ isActive }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    resources,
    loading,
    costsLoading,
    error,
    fetchResources,
    refreshResources
  } = useResources();

  const [selectedResource, setSelectedResource] = useState(null);
  const [hasLoadedRef, setHasLoadedRef] = useState(false);
  const [refreshSuccess, setRefreshSuccess] = useState(false);
  const filteredResourcesRef = useRef([]);

  // Fetch resources when tab becomes active
  useEffect(() => {
    if (isActive && !hasLoadedRef) {
      setHasLoadedRef(true);
      fetchResources();
    }
  }, [isActive, hasLoadedRef, fetchResources]);

  // Sync selected resource with URL parameter
  useEffect(() => {
    const resourceParam = searchParams.get("resource");
    if (resourceParam && resources.length > 0) {
      const resource = resources.find(r => r.name === resourceParam);
      if (resource) {
        setSelectedResource(resource);
      }
    } else if (!resourceParam && selectedResource) {
      setSelectedResource(null);
    }
  }, [searchParams, resources, selectedResource]);

  const handleRefresh = async () => {
    await refreshResources();
    // Show success indicator
    setRefreshSuccess(true);
    setTimeout(() => setRefreshSuccess(false), 1000);
  };

  const handleExportCSV = () => {
    exportResourcesToCSV(filteredResourcesRef.current);
  };

  const handleFilteredResourcesChange = (filteredResources) => {
    filteredResourcesRef.current = filteredResources;
  };

  const handleSelectResource = (resource) => {
    setSelectedResource(resource);
    // Update URL with resource parameter
    const newParams = new URLSearchParams(searchParams);
    newParams.set("resource", resource.name);
    setSearchParams(newParams);
  };

  const handleCloseDrawer = () => {
    setSelectedResource(null);
    // Remove resource parameter from URL
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("resource");
    setSearchParams(newParams);
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
          <div className="resources-actions">
            <button className="export-btn" onClick={handleExportCSV} title="Export to CSV">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12L3 7h3V1h4v6h3l-5 5z"/>
                <path d="M14 14H2v-2h12v2z"/>
              </svg>
            </button>
            <button className="refresh-btn" onClick={handleRefresh} title="Refresh resources">
              ↻
            </button>
          </div>
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
    // Truncate resource name if too long
    const displayName = selectedResource.name.length > 50
      ? selectedResource.name.substring(0, 50) + "..."
      : selectedResource.name;

    return (
      <div className="resources-panel">
        <div className="resources-header">
          <nav className="breadcrumb">
            <button className="breadcrumb-link" onClick={handleCloseDrawer} title="Back to resources">
              Resources
            </button>
            <span className="breadcrumb-separator">›</span>
            <span className="breadcrumb-current" title={selectedResource.name}>
              {displayName}
            </span>
          </nav>
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
        <div className="resources-actions">
          <button
            className="export-btn"
            onClick={handleExportCSV}
            title="Export to CSV"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 12L3 7h3V1h4v6h3l-5 5z"/>
              <path d="M14 14H2v-2h12v2z"/>
            </svg>
          </button>
          <button
            className={`refresh-btn ${loading ? 'refresh-btn--loading' : ''} ${refreshSuccess ? 'refresh-btn--success' : ''}`}
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh resources"
          >
            ↻
          </button>
        </div>
      </div>

      <div className="resources-content">
        <ResourcesTable
          resources={resources}
          onSelectResource={handleSelectResource}
          selectedResource={selectedResource}
          costsLoading={costsLoading}
          onFilteredResourcesChange={handleFilteredResourcesChange}
        />
      </div>
    </div>
  );
}

export default ResourcesPanel;
