import React from "react";
import EmptyState from "./EmptyState";
import "../styles/JobsList.css";

function JobsList({
  jobs,
  selectedJob,
  onSelectJob,
  jobsLoading,
  jobsError,
  currentPage,
  totalPages,
  onPageChange
}) {
  if (jobsLoading) {
    return <EmptyState message="Loading jobs…" />;
  }

  if (jobsError) {
    return (
      <div className="alert alert--error">
        <strong>Error:</strong> {jobsError}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <EmptyState
        message="No jobs found yet."
        subMessage="Submit a request from the Blueprints tab to see it here."
      />
    );
  }

  return (
    <>
      <div className="jobs-list">
        <ul className="jobs-list">
          {jobs.map((job) => (
            <li
              key={job.id}
              className={
                "job-item" +
                (selectedJob && selectedJob.id === job.id
                  ? " job-item--active"
                  : "")
              }
              onClick={() => onSelectJob(job)}
            >
              <div className="job-line">
                <span className="job-title">
                  {job.blueprintId || "Provision request"}
                </span>
                <span
                  className={`job-status job-status--${
                    job.status || "unknown"
                  }`}
                >
                  {job.status || "unknown"}
                </span>
              </div>

              <div className="job-meta">
                env: {job.environment || "n/a"} · #
                {job.number} ·{" "}
                {job.createdAt
                  ? new Date(job.createdAt).toLocaleString()
                  : "time unknown"}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="jobs-pagination">
        <button
          className="nav-pill"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          ← Prev
        </button>
        <span className="jobs-pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="nav-pill"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          Next →
        </button>
      </div>
    </>
  );
}

export default JobsList;
