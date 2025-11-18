import React from "react";
import EmptyState from "./EmptyState";
import ResultRow from "./ResultRow";
import StatusBadge from "./StatusBadge";
import TerraformOutputs from "./TerraformOutputs";
import ResourceActions from "./ResourceActions";
import SkeletonLoader from "./SkeletonLoader";
import "../styles/JobDetail.css";

/**
 * Component for displaying job/PR details
 */
function JobDetail({ job, loading, error, onUpdate, onDelete, onPromote, promoteLoading }) {
  if (!job && !loading) {
    return (
      <EmptyState
        message="No job selected"
        subMessage="Select a job from the list to view its details."
      />
    );
  }

  if (loading) {
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

  return (
    <div className="result-card jobs-detail">
      <ResourceActions
        job={job}
        onPromote={onPromote}
        onUpdate={onUpdate}
        onDelete={onDelete}
        promoteLoading={promoteLoading}
      />

      <ResultRow label="Status" value={job.status} />

      <ResultRow
        label="Plan"
        value={<StatusBadge status={job.planStatus} />}
      />

      <ResultRow
        label="Apply"
        value={<StatusBadge status={job.applyStatus} />}
      />

      {job.pullRequestUrl && (
        <ResultRow
          label="Pull Request"
          value={
            <a
              className="result-link"
              href={job.pullRequestUrl}
              target="_blank"
              rel="noreferrer"
            >
              View on GitHub
            </a>
          }
        />
      )}

      {job.headRef && <ResultRow label="Branch" value={job.headRef} />}

      {job.author && <ResultRow label="Author" value={job.author} />}

      {job.createdBy && <ResultRow label="Created by" value={`@${job.createdBy}`} />}

      {job.changedFiles !== undefined && (
        <ResultRow
          label="Changes"
          value={
            <span className="result-value">
              {job.changedFiles} file{job.changedFiles !== 1 ? 's' : ''}
              {job.additions > 0 && <span style={{ color: '#22c55e' }}> +{job.additions}</span>}
              {job.deletions > 0 && <span style={{ color: '#f87171' }}> -{job.deletions}</span>}
            </span>
          }
        />
      )}

      {job.terraformModule && (
        <ResultRow
          label="Terraform Module"
          stacked
          value={<pre className="terraform-code">{job.terraformModule}</pre>}
        />
      )}

      <TerraformOutputs outputs={job.outputs} loading={loading} error={error} />
    </div>
  );
}

export default JobDetail;
