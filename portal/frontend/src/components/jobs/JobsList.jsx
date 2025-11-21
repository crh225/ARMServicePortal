import React from "react";
import EmptyState from "../shared/EmptyState";
import JobListSkeleton from "./JobListSkeleton";
import "../../styles/JobsList.css";

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
    return <JobListSkeleton count={5} />;
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
              className="job-item"
              onClick={() => onSelectJob(job)}
            >
              <div className="job-item-content">
                <div className="job-item-main">
                  {/* Status Icon */}
                  <div className="job-status-icon">
                    {job.merged ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="job-icon job-icon--success">
                        <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
                      </svg>
                    ) : job.status === "open" ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="job-icon job-icon--pending">
                        <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Zm7-3.25v2.992l2.028.812a.75.75 0 0 1-.557 1.392l-2.5-1A.751.751 0 0 1 7 8.25v-3.5a.75.75 0 0 1 1.5 0Z"></path>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="job-icon job-icon--failed">
                        <path d="M2.343 13.657A8 8 0 1 1 13.658 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z"></path>
                      </svg>
                    )}
                  </div>

                  <div className="job-content">
                    <div className="job-line">
                      <span className="job-title">
                        {job.blueprintId || "Provision request"}
                      </span>
                      <div className="job-badges">
                        {/* Environment Badge */}
                        {job.environment && (
                          <span className="job-badge job-badge--env">
                            {job.environment}
                          </span>
                        )}
                        {/* Status Badge */}
                        <span
                          className={`job-status job-status--${
                            job.status || "unknown"
                          }`}
                        >
                          {job.status || "unknown"}
                        </span>
                      </div>
                    </div>

                    <div className="job-meta">
                      {/* Branch Badge - in the middle */}
                      {job.headRef && (
                        <span className="job-badge job-badge--branch">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z"></path>
                          </svg>
                          {job.headRef.split('/').pop()}
                        </span>
                      )}
                      {/* Job Number */}
                      <span className="job-meta-text">#{job.number}</span>
                      {/* Author */}
                      {job.createdBy && (
                        <span className="job-meta-text">{job.createdBy}</span>
                      )}
                      {/* Duration/Time */}
                      <span className="job-meta-text">
                        {job.createdAt
                          ? new Date(job.createdAt).toLocaleString()
                          : "time unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                <svg className="job-chevron" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path>
                </svg>
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
