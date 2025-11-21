import React, { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useJobs } from "../../hooks/useJobs";
import { useJobActions } from "../../hooks/useJobActions.jsx";
import JobsList from "./JobsList";
import JobDetail from "./JobDetail";
import JobFilters from "./JobFilters";
import Modal from "../shared/Modal";
import ConfirmModal from "../shared/ConfirmModal";
import "../../styles/JobsList.css";
import "../../styles/JobDetail.css";

/**
 * Container component for the Jobs tab
 * Handles all jobs-related logic and state
 * Now works like GitHub Actions with list and detail views
 */
function JobsPanel({ isActive, onUpdateResource }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    jobs,
    allJobs,
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

  // Check if we're viewing a specific job
  const jobIdParam = searchParams.get("job");
  const isViewingDetail = !!jobIdParam;

  // Initialize filters - set to "all" if job ID is in URL
  const [statusFilter, setStatusFilter] = useState(jobIdParam ? "all" : "merged");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [blueprintFilter, setBlueprintFilter] = useState("all");
  const [jobIdFilter, setJobIdFilter] = useState(jobIdParam || "");

  // Use job actions hook for destroy/promote functionality
  const {
    modalState,
    confirmState,
    promoteLoading,
    handleDelete,
    confirmDelete,
    handlePromote,
    closeModal,
    closeConfirm
  } = useJobActions(refreshJobs);

  // Track if we've loaded jobs to prevent duplicate fetches
  const hasLoadedRef = useRef(false);

  // Refresh jobs when tab becomes active (only once)
  useEffect(() => {
    if (isActive && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      refreshJobs();
    }
  }, [isActive, refreshJobs]);

  // Get unique environments and blueprints from jobs
  const { environments, blueprints } = useMemo(() => {
    const envSet = new Set();
    const bpSet = new Set();
    allJobs.forEach(job => {
      if (job.environment) envSet.add(job.environment);
      if (job.blueprintId) bpSet.add(job.blueprintId);
    });
    return {
      environments: Array.from(envSet).sort(),
      blueprints: Array.from(bpSet).sort()
    };
  }, [allJobs]);

  // Filter jobs based on status, environment, blueprint, and job ID
  const filteredJobs = useMemo(() => {
    let filtered = allJobs;

    // Job ID filter - takes precedence over all other filters
    if (jobIdFilter) {
      const jobId = parseInt(jobIdFilter, 10);
      if (!isNaN(jobId)) {
        filtered = filtered.filter(job => job.number === jobId);
        return filtered;
      }
    }

    // Status filter
    if (statusFilter === "merged") {
      filtered = filtered.filter(job => job.merged);
    } else if (statusFilter === "open") {
      filtered = filtered.filter(job => job.status === "open");
    } else if (statusFilter === "closed") {
      filtered = filtered.filter(job => job.status === "closed" && !job.merged);
    }

    // Environment filter
    if (environmentFilter !== "all") {
      filtered = filtered.filter(job => job.environment === environmentFilter);
    }

    // Blueprint filter
    if (blueprintFilter !== "all") {
      filtered = filtered.filter(job => job.blueprintId === blueprintFilter);
    }

    return filtered;
  }, [allJobs, statusFilter, environmentFilter, blueprintFilter, jobIdFilter]);

  // Recalculate pagination for filtered jobs
  const pageSize = 5;
  const filteredTotalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const filteredCurrentPage = Math.min(currentPage, filteredTotalPages);
  const startIndex = (filteredCurrentPage - 1) * pageSize;
  const filteredPageJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

  // Load job detail when job ID is in URL
  useEffect(() => {
    if (jobIdParam && allJobs.length > 0) {
      const jobId = parseInt(jobIdParam, 10);
      if (!isNaN(jobId)) {
        const job = allJobs.find(j => j.number === jobId);
        if (job) {
          loadJobDetail(job);
        }
      }
    }
  }, [jobIdParam, allJobs, loadJobDetail]);

  // Handle job selection - update URL and load detail
  const handleSelectJob = (job) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("job", job.number.toString());
    setSearchParams(newParams);
    loadJobDetail(job);
  };

  // Handle back to list - remove job param from URL
  const handleBackToList = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("job");
    setSearchParams(newParams);
  };

  // Handle update resource
  const handleUpdate = (job) => {
    if (onUpdateResource) {
      onUpdateResource(job);
    }
  };

  return (
    <>
      {!isViewingDetail ? (
        // List View
        <div className="panel panel--full">
          <div>
            <h2 className="panel-title">Jobs</h2>
            <p className="panel-help">
              Recent self-service requests created as GitHub pull requests.
            </p>
          </div>

          <JobFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            environmentFilter={environmentFilter}
            onEnvironmentFilterChange={setEnvironmentFilter}
            blueprintFilter={blueprintFilter}
            onBlueprintFilterChange={setBlueprintFilter}
            jobIdFilter={jobIdFilter}
            onJobIdFilterChange={setJobIdFilter}
            environments={environments}
            blueprints={blueprints}
          />

          <JobsList
            jobs={filteredPageJobs}
            selectedJob={null}
            onSelectJob={handleSelectJob}
            jobsLoading={jobsLoading}
            jobsError={jobsError}
            currentPage={filteredCurrentPage}
            totalPages={filteredTotalPages}
            onPageChange={setJobsPage}
          />
        </div>
      ) : (
        // Detail View
        <div className="panel panel--full">
          {/* Breadcrumb */}
          <div className="job-breadcrumb">
            <button className="breadcrumb-link" onClick={handleBackToList}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z"></path>
              </svg>
              Jobs
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">
              {selectedJob ? `#${selectedJob.number}` : "Loading..."}
            </span>
          </div>

          {/* Job Detail */}
          <JobDetail
            job={selectedJob}
            loading={jobDetailLoading}
            error={jobDetailError}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onPromote={handlePromote}
            promoteLoading={promoteLoading}
          />
        </div>
      )}

      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        type={modalState.type}
      >
        {modalState.content}
      </Modal>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmDelete}
        title="Delete Resource"
        message={
          <div>
            <p>Are you sure you want to delete <strong>"{confirmState.job?.title}"</strong>?</p>
            <p>This will create a PR to destroy the deployed infrastructure.</p>
          </div>
        }
        confirmText="Delete"
        cancelText="Cancel"
        type="warning"
      />
    </>
  );
}

export default JobsPanel;
