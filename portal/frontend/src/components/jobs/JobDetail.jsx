import React from "react";
import EmptyState from "../shared/EmptyState";
import ResultRow from "./ResultRow";
import StatusBadge from "../shared/StatusBadge";
import TerraformOutputs from "./TerraformOutputs";
import CrossplaneCredentials from "./CrossplaneCredentials";
import ResourceActions from "../resources/ResourceActions";
import JobDetailSkeleton from "./JobDetailSkeleton";
import "../../styles/JobDetail.css";

// Provider badge component
function ProviderBadge({ provider }) {
  const config = {
    terraform: { label: "Terraform", color: "#7B42BC" },
    crossplane: { label: "Crossplane", color: "#1572B6" }
  };
  const { label, color } = config[provider] || config.terraform;

  return (
    <span
      className="provider-badge"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {label}
    </span>
  );
}

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
    return <JobDetailSkeleton />;
  }

  const isCrossplane = job.provider === "crossplane";

  return (
    <div className="job-detail-container">
      {/* Header Section */}
      <div className="job-detail-header">
        <div className="job-detail-title-section">
          <h1 className="job-detail-title">
            {job.title || job.blueprintId || "Provision request"}
          </h1>
          <div className="job-detail-meta">
            <StatusBadge status={job.status} />
            <ProviderBadge provider={job.provider} />
            <span className="job-detail-meta-item">#{job.number}</span>
            {job.environment && (
              <span className="job-detail-meta-item">env: {job.environment}</span>
            )}
            {job.createdBy && (
              <span className="job-detail-meta-item">@{job.createdBy}</span>
            )}
          </div>
        </div>

        <ResourceActions
          job={job}
          onPromote={onPromote}
          onUpdate={onUpdate}
          onDelete={onDelete}
          promoteLoading={promoteLoading}
        />
      </div>

      {/* Main Content */}
      <div className="job-detail-content">
        {/* Status and Details - Side by Side */}
        <div className="job-detail-row">
          {/* Status Section */}
          <div className="job-detail-section">
            <h2 className="job-detail-section-title">Status</h2>
            <div className="job-detail-section-content">
              <ResultRow label="PR Status" value={job.status} />
              {!isCrossplane && (
                <>
                  <ResultRow label="Plan" value={<StatusBadge status={job.planStatus} />} />
                  <ResultRow label="Apply" value={<StatusBadge status={job.applyStatus} />} />
                </>
              )}
              {isCrossplane && (
                <ResultRow
                  label="Sync"
                  value={<StatusBadge status={job.merged ? "ok" : "pending"} />}
                />
              )}
              <ResultRow
                label="Created At"
                value={job.createdAt ? new Date(job.createdAt).toLocaleString() : "Unknown"}
              />
            </div>
          </div>

          {/* Details Section */}
          <div className="job-detail-section">
            <h2 className="job-detail-section-title">Details</h2>
            <div className="job-detail-section-content">
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
                      View on GitHub →
                    </a>
                  }
                />
              )}
              {job.headRef && <ResultRow label="Branch" value={job.headRef} />}
              {job.author && <ResultRow label="Author" value={job.author} />}
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
            </div>
          </div>
        </div>

        {/* Terraform Module Section - only for Terraform */}
        {!isCrossplane && job.terraformModule && (
          <div className="job-detail-section">
            <h2 className="job-detail-section-title">Terraform Module</h2>
            <div className="job-detail-section-content">
              <pre className="terraform-code">{job.terraformModule}</pre>
            </div>
          </div>
        )}

        {/* Crossplane Info Section - only for Crossplane */}
        {isCrossplane && job.terraformModule && (
          <div className="job-detail-section">
            <h2 className="job-detail-section-title">Crossplane Claim</h2>
            <div className="job-detail-section-content">
              <ResultRow label="Claim Name" value={job.terraformModule} />
              <p className="crossplane-hint">
                Crossplane claims are synced via ArgoCD. Once the PR is merged, the claim will be
                applied to the cluster and Crossplane will provision the resources.
              </p>
            </div>
          </div>
        )}

        {/* Crossplane Credentials Section - only for Crossplane when merged */}
        {isCrossplane && job.merged && job.blueprintId && job.environment && (
          <div className="job-detail-section">
            <h2 className="job-detail-section-title">Access Credentials</h2>
            <div className="job-detail-section-content">
              <CrossplaneCredentials
                blueprintId={job.blueprintId}
                name={job.crossplaneResourceName}
                environment={job.environment}
              />
            </div>
          </div>
        )}

        {/* Terraform Outputs Section - only for Terraform */}
        {!isCrossplane && (
          <div className="job-detail-section">
            <h2 className="job-detail-section-title">Terraform Outputs</h2>
            <div className="job-detail-section-content">
              <TerraformOutputs outputs={job.outputs} loading={loading} error={error} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default JobDetail;
