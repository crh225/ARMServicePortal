import React, { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useJobs } from "../hooks/useJobs";
import JobsList from "./JobsList";
import JobDetail from "./JobDetail";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";
import api from "../services/api";
import "../styles/JobsList.css";

/**
 * Container component for the Jobs tab
 * Handles all jobs-related logic and state
 */
function JobsPanel({ isActive, onUpdateResource }) {
  const [searchParams] = useSearchParams();
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

  // Initialize filters - set to "all" if job ID is in URL
  const jobIdParam = searchParams.get("job");
  const [statusFilter, setStatusFilter] = useState(jobIdParam ? "all" : "merged");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [blueprintFilter, setBlueprintFilter] = useState("all");
  const [jobIdFilter, setJobIdFilter] = useState(jobIdParam || "");
  const [modalState, setModalState] = useState({ isOpen: false, type: "info", title: "", content: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, job: null });
  const [promoteLoading, setPromoteLoading] = useState(false);

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

  // Auto-select first filtered job when filters change or jobs load
  useEffect(() => {
    // If selected job is not in filtered list, select first filtered job
    if (filteredJobs.length > 0) {
      const isSelectedJobInFilteredList = selectedJob && filteredJobs.some(j => j.number === selectedJob.number);
      if (!isSelectedJobInFilteredList) {
        loadJobDetail(filteredJobs[0]);
      }
    } else if (selectedJob) {
      // No filtered jobs but we have a selected job - clear it
      loadJobDetail(null);
    }
  }, [filteredJobs, selectedJob, loadJobDetail]);

  // Handle update resource
  const handleUpdate = (job) => {
    if (onUpdateResource) {
      onUpdateResource(job);
    }
  };

  // Handle delete resource - show confirmation
  const handleDelete = (job) => {
    setConfirmState({ isOpen: true, job });
  };

  // Confirm delete resource
  const confirmDelete = async () => {
    const job = confirmState.job;
    if (!job) return;

    try {
      const result = await api.destroyResource(job.number);
      setModalState({
        isOpen: true,
        type: "success",
        title: "Destroy PR Created",
        content: (
          <div>
            <p><strong>PR #{result.pr.number}:</strong> {result.pr.title}</p>
            <p>
              <a href={result.pr.url} target="_blank" rel="noreferrer">
                {result.pr.url}
              </a>
            </p>
            <p>Merge this PR to destroy the deployed infrastructure.</p>
          </div>
        )
      });
      // Refresh jobs to show the new destroy PR
      refreshJobs();
    } catch (err) {
      console.error("Error creating destroy PR:", err);
      setModalState({
        isOpen: true,
        type: "error",
        title: "Failed to Create Destroy PR",
        content: (
          <div>
            <p>{err.message}</p>
          </div>
        )
      });
    }
  };

  // Handle promote resource
  const handlePromote = async (job) => {
    const environmentPath = {
      dev: "qa",
      qa: "staging",
      staging: "prod",
      prod: null
    };
    const targetEnv = environmentPath[job.environment];

    if (!targetEnv) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "Cannot Promote",
        content: (
          <div>
            <p>Production is the final environment and cannot be promoted further.</p>
          </div>
        )
      });
      return;
    }

    setPromoteLoading(true);
    try {
      const result = await api.promoteResource(job.number);
      setModalState({
        isOpen: true,
        type: "success",
        title: "Promotion PR Created",
        content: (
          <div>
            <p><strong>Environment Promotion:</strong> {result.sourceEnvironment} → {result.targetEnvironment}</p>
            <p><strong>PR #{result.pr.number}:</strong> {result.pr.title}</p>
            <p>
              <a href={result.pr.url} target="_blank" rel="noreferrer">
                {result.pr.url}
              </a>
            </p>
            <p>This PR will deploy the resource configuration to {result.targetEnvironment}.</p>
            {result.targetEnvironment === "staging" && (
              <p style={{ marginTop: "8px", color: "#d97706" }}>
                ⚠️ Requires 1 approval and QA validation.
              </p>
            )}
            {result.targetEnvironment === "prod" && (
              <p style={{ marginTop: "8px", color: "#dc2626" }}>
                🔴 Requires 2 approvals and change control documentation.
              </p>
            )}
          </div>
        )
      });
      // Refresh jobs to show the new promotion PR
      refreshJobs();
    } catch (err) {
      console.error("Error creating promotion PR:", err);
      setModalState({
        isOpen: true,
        type: "error",
        title: "Failed to Create Promotion PR",
        content: (
          <div>
            <p>{err.message}</p>
          </div>
        )
      });
    } finally {
      setPromoteLoading(false);
    }
  };

  return (
    <>
      <section className="panel panel--left">
        <div>
          <h2 className="panel-title">Jobs</h2>
          <p className="panel-help">
            Recent self-service requests created as GitHub pull requests.
          </p>
        </div>

        <div className="job-filters">
          <div className="job-filters-row">
            <input
              type="text"
              className="job-id-input"
              placeholder="Job ID..."
              value={jobIdFilter}
              onChange={(e) => setJobIdFilter(e.target.value)}
            />
            <div className="filter-pill-group">
              <button
                className={`filter-pill ${statusFilter === "all" ? "filter-pill--active" : ""}`}
                onClick={() => setStatusFilter("all")}
                disabled={!!jobIdFilter}
              >
                All
              </button>
              <button
                className={`filter-pill ${statusFilter === "merged" ? "filter-pill--active" : ""}`}
                onClick={() => setStatusFilter("merged")}
                disabled={!!jobIdFilter}
              >
                Deployed
              </button>
              <button
                className={`filter-pill ${statusFilter === "open" ? "filter-pill--active" : ""}`}
                onClick={() => setStatusFilter("open")}
                disabled={!!jobIdFilter}
              >
                Open
              </button>
              <button
                className={`filter-pill ${statusFilter === "closed" ? "filter-pill--active" : ""}`}
                onClick={() => setStatusFilter("closed")}
                disabled={!!jobIdFilter}
              >
                Closed
              </button>
            </div>
          </div>

          <div className="job-filters-row">
            <select
              className="filter-select"
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value)}
              disabled={!!jobIdFilter}
            >
              <option value="all">All Environments</option>
              {environments.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>

            <select
              className="filter-select"
              value={blueprintFilter}
              onChange={(e) => setBlueprintFilter(e.target.value)}
              disabled={!!jobIdFilter}
            >
              <option value="all">All Blueprints</option>
              {blueprints.map(bp => (
                <option key={bp} value={bp}>{bp}</option>
              ))}
            </select>
          </div>
        </div>

        <JobsList
          jobs={filteredPageJobs}
          selectedJob={selectedJob}
          onSelectJob={loadJobDetail}
          jobsLoading={jobsLoading}
          jobsError={jobsError}
          currentPage={filteredCurrentPage}
          totalPages={filteredTotalPages}
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
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onPromote={handlePromote}
          promoteLoading={promoteLoading}
        />
      </aside>

      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        type={modalState.type}
      >
        {modalState.content}
      </Modal>

      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ isOpen: false, job: null })}
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
