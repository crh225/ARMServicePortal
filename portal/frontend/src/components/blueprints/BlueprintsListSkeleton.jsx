import React from "react";
import "../../styles/BlueprintsList.css";

/**
 * Single skeleton card for blueprint loading state
 */
function SkeletonCard() {
  return (
    <div className="blueprint-card blueprint-card--skeleton">
      <div className="blueprint-card-header">
        <div className="skeleton skeleton-icon" />
        <div className="blueprint-meta">
          <div className="skeleton skeleton-category" />
          <div className="skeleton skeleton-version" />
        </div>
      </div>
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-desc" />
      <div className="skeleton skeleton-desc-short" />
      <div className="blueprint-footer">
        <div className="blueprint-stats">
          <div className="skeleton skeleton-provider" />
          <div className="skeleton skeleton-stat" />
        </div>
        <div className="skeleton skeleton-cost" />
      </div>
    </div>
  );
}

/**
 * Skeleton loader for blueprints list
 * Shows placeholder cards while blueprints are loading
 */
function BlueprintsListSkeleton({ count = 8 }) {
  return (
    <div>
      <div className="blueprint-header-section">
        <div>
          <h2 className="panel-title">Service Catalog</h2>
          <p className="panel-help">
            Choose from pre-approved infrastructure templates
          </p>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="blueprint-search">
        <div className="skeleton" style={{ width: "100%", height: "40px", borderRadius: "8px" }} />
      </div>

      <div className="blueprint-grid">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export default BlueprintsListSkeleton;
