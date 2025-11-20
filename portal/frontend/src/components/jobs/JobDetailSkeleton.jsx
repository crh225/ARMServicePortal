import React from "react";
import SkeletonLoader from "../shared/SkeletonLoader";

/**
 * Skeleton loader for job detail view
 */
function JobDetailSkeleton() {
  return (
    <div className="result-card jobs-detail">
      <div style={{ padding: "1rem" }}>
        {/* Action buttons skeleton */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <SkeletonLoader type="button" width="120px" />
          <SkeletonLoader type="button" width="100px" />
          <SkeletonLoader type="button" width="100px" />
        </div>

        {/* Job details skeleton */}
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <SkeletonLoader type="text" width="100px" height="0.875rem" />
              <SkeletonLoader type="text" width="200px" />
            </div>
          </div>
        ))}

        {/* Terraform module skeleton */}
        <div style={{ marginTop: "1.5rem" }}>
          <SkeletonLoader type="text" width="150px" height="0.875rem" />
          <div style={{ marginTop: "0.5rem" }}>
            <SkeletonLoader type="card" height="150px" />
          </div>
        </div>

        {/* Terraform outputs skeleton */}
        <div style={{ marginTop: "1.5rem" }}>
          <SkeletonLoader type="text" width="150px" height="0.875rem" />
          <div style={{ marginTop: "0.5rem" }}>
            <SkeletonLoader type="text" count={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetailSkeleton;
