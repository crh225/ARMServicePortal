import React from "react";
import EmptyState from "./EmptyState";
import ResultRow from "./ResultRow";
import StatusBadge from "./StatusBadge";
import TerraformOutputs from "./TerraformOutputs";
import ResourceActions from "./ResourceActions";
import "../styles/JobDetail.css";

/**
 * Component for displaying job/PR details
 */
function JobDetail({ job, loading, error, onUpdate, onDelete, onPromote, promoteLoading }) {
  if (!job) {
    return (
      <EmptyState
        message="No job selected"
        subMessage="Select a job from the list to view its details."
      />
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
