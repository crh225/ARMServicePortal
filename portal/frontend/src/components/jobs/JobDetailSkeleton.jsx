import React from "react";
import SkeletonLoader from "../shared/SkeletonLoader";
import "../../styles/JobDetail.css";

/**
 * Skeleton loader for job detail view
 * Matches the GitHub Actions-style layout with header, status/details panels, and sections
 */
function JobDetailSkeleton() {
  return (
    <div className="job-detail-container">
      {/* Header Section */}
      <div className="job-detail-header">
        <div className="job-detail-title-section">
          {/* Title */}
          <div style={{ marginBottom: "12px" }}>
            <SkeletonLoader type="title" width="300px" height="32px" />
          </div>
          {/* Metadata badges */}
          <div className="job-detail-meta">
            <SkeletonLoader type="badge" width="80px" height="22px" />
            <SkeletonLoader type="text" width="40px" height="14px" />
            <SkeletonLoader type="text" width="70px" height="14px" />
            <SkeletonLoader type="text" width="80px" height="14px" />
          </div>
        </div>

        {/* Action buttons - 3 column grid */}
        <div className="resource-actions">
          <SkeletonLoader type="button" width="100%" height="32px" />
          <SkeletonLoader type="button" width="100%" height="32px" />
          <SkeletonLoader type="button" width="100%" height="32px" />
        </div>
      </div>

      {/* Main Content */}
      <div className="job-detail-content">
        {/* Status and Details - Side by Side */}
        <div className="job-detail-row">
          {/* Status Section */}
          <div className="job-detail-section">
            <h2 className="job-detail-section-title">
              <SkeletonLoader type="text" width="50px" height="14px" />
            </h2>
            <div className="job-detail-section-content">
              {/* 4 status rows */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="result-row">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <SkeletonLoader type="text" width="80px" height="13px" />
                    <SkeletonLoader type="badge" width="70px" height="20px" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="job-detail-section">
            <h2 className="job-detail-section-title">
              <SkeletonLoader type="text" width="50px" height="14px" />
            </h2>
            <div className="job-detail-section-content">
              {/* 4 detail rows */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="result-row">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                    <SkeletonLoader type="text" width="80px" height="13px" />
                    <SkeletonLoader type="text" width="140px" height="13px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Terraform Module Section */}
        <div className="job-detail-section">
          <h2 className="job-detail-section-title">
            <SkeletonLoader type="text" width="130px" height="14px" />
          </h2>
          <div className="job-detail-section-content">
            <div style={{ padding: "12px" }}>
              <SkeletonLoader type="card" height="120px" />
            </div>
          </div>
        </div>

        {/* Terraform Outputs Section */}
        <div className="job-detail-section">
          <h2 className="job-detail-section-title">
            <SkeletonLoader type="text" width="140px" height="14px" />
          </h2>
          <div className="job-detail-section-content">
            {/* 3 output rows */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="result-row">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                  <SkeletonLoader type="text" width="100px" height="13px" />
                  <SkeletonLoader type="text" width="180px" height="13px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobDetailSkeleton;
