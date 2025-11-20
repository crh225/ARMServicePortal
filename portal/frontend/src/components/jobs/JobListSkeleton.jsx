import React from "react";
import SkeletonLoader from "../shared/SkeletonLoader";

/**
 * Skeleton loader for job list items
 */
function JobListSkeleton({ count = 5 }) {
  return (
    <div className="jobs-list">
      <div style={{ padding: "1rem" }}>
        {Array(count).fill(null).map((_, i) => (
          <div key={i} style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <SkeletonLoader type="text" width="60%" />
              <SkeletonLoader type="badge" width="80px" />
            </div>
            <SkeletonLoader type="text" width="40%" height="0.875rem" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default JobListSkeleton;
