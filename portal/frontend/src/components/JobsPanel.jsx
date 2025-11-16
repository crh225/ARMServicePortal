import React, { useEffect, useRef } from "react";
import { useJobs } from "../hooks/useJobs";
import JobsList from "./JobsList";
import JobDetail from "./JobDetail";

/**
 * Container component for the Jobs tab
 * Handles all jobs-related logic and state
 */
function JobsPanel({ isActive }) {
  const {
    jobs,
    jobsLoading,
    jobsError,
    selectedJob,
    jobDetailLoading,
    jobDetailError,
    currentPage,
    totalPages,
    setJobsPage,
    refreshJobs,
    loadJobDetail
  } = useJobs();

  // Track if we've loaded jobs to prevent duplicate fetches
  const hasLoadedRef = useRef(false);

  // Refresh jobs when tab becomes active (only once)
  useEffect(() => {
    if (isActive && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      refreshJobs();
    }
  }, [isActive, refreshJobs]);

  return (
    <>
      <section className="panel panel--left">
        <div>
          <h2 className="panel-title">Jobs</h2>
          <p className="panel-help">
            Recent self-service requests created as GitHub pull requests.
          </p>
        </div>

        <JobsList
          jobs={jobs}
          selectedJob={selectedJob}
          onSelectJob={loadJobDetail}
          jobsLoading={jobsLoading}
          jobsError={jobsError}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setJobsPage}
        />
      </section>

      <aside className="panel panel--right">
        <div>
          <h2 className="panel-title">Job Details</h2>
          <p className="panel-help">
            View pull request status and Terraform outputs.
          </p>
        </div>

        <JobDetail
          job={selectedJob}
          loading={jobDetailLoading}
          error={jobDetailError}
        />
      </aside>
    </>
  );
}

export default JobsPanel;
