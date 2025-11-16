import React from "react";
import EmptyState from "./EmptyState";
import "../styles/JobDetail.css";

function JobDetail({ job, loading, error }) {
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
      <div className="result-row">
        <span className="result-label">Status</span>
        <span className="result-value">
          {job.status}
        </span>
      </div>

      <div className="result-row">
        <span className="result-label">Plan</span>
        <span
          className={`badge badge--${
            job.planStatus || "unknown"
          }`}
        >
          {job.planStatus || "unknown"}
        </span>
      </div>

      <div className="result-row">
        <span className="result-label">Apply</span>
        <span
          className={`badge badge--${
            job.applyStatus || "unknown"
          }`}
        >
          {job.applyStatus || "unknown"}
        </span>
      </div>

      {job.pullRequestUrl && (
        <div className="result-row">
          <span className="result-label">Pull Request</span>
          <a
            className="result-link"
            href={job.pullRequestUrl}
            target="_blank"
            rel="noreferrer"
          >
            View on GitHub
          </a>
        </div>
      )}

      {job.headRef && (
        <div className="result-row">
          <span className="result-label">Branch</span>
          <span className="result-value">
            {job.headRef}
          </span>
        </div>
      )}

      {loading && (
        <div className="result-row">
          <span className="result-label">Outputs</span>
          <span className="result-value">
            Loading outputs…
          </span>
        </div>
      )}

      {error && (
        <div className="alert alert--error">
          <strong>Error loading outputs:</strong>{" "}
          {error}
        </div>
      )}

      {job.outputs && !loading && (
        <div className="result-row result-row--stacked">
          <span className="result-label">Outputs</span>
          <div className="result-value result-value--mono">
            {Object.entries(job.outputs).map(
              ([key, obj]) => (
                <div key={key}>
                  <strong>{key}</strong>:{" "}
                  {typeof obj === "object" &&
                  obj !== null &&
                  "value" in obj
                    ? String(obj.value)
                    : String(obj)}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default JobDetail;
