import React, { useEffect, useRef, useState, useMemo } from "react";
import { useJobs } from "../hooks/useJobs";
import JobsList from "./JobsList";
import JobDetail from "./JobDetail";
import Modal from "./Modal";
import ConfirmModal from "./ConfirmModal";
import api from "../services/api";

/**
 * Container component for the Jobs tab
 * Handles all jobs-related logic and state
 */
function JobsPanel({ isActive, onUpdateResource }) {
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

  const [statusFilter, setStatusFilter] = useState("merged");
  const [environmentFilter, setEnvironmentFilter] = useState("all");
  const [blueprintFilter, setBlueprintFilter] = useState("all");
  const [modalState, setModalState] = useState({ isOpen: false, type: "info", title: "", content: null });
  const [confirmState, setConfirmState] = useState({ isOpen: false, job: null });

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

  // Filter jobs based on status, environment, and blueprint
  const filteredJobs = useMemo(() => {
    let filtered = allJobs;

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
  }, [allJobs, statusFilter, environmentFilter, blueprintFilter]);

  // Recalculate pagination for filtered jobs
  const pageSize = 5;
  const filteredTotalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const filteredCurrentPage = Math.min(currentPage, filteredTotalPages);
  const startIndex = (filteredCurrentPage - 1) * pageSize;
  const filteredPageJobs = filteredJobs.slice(startIndex, startIndex + pageSize);

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

  return (
    <>
      <section className="panel panel--left">
        <div>
          <h2 className="panel-title">Jobs</h2>
          <p className="panel-help">
            Recent self-service requests created as GitHub pull requests.
          </p>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <div style={{ marginBottom: "6px", display: "flex", gap: "8px" }}>
            <button
              className={`nav-pill ${statusFilter === "all" ? "nav-pill--active" : ""}`}
              onClick={() => setStatusFilter("all")}
            >
              All
            </button>
            <button
              className={`nav-pill ${statusFilter === "merged" ? "nav-pill--active" : ""}`}
              onClick={() => setStatusFilter("merged")}
            >
              Deployed
            </button>
            <button
              className={`nav-pill ${statusFilter === "open" ? "nav-pill--active" : ""}`}
              onClick={() => setStatusFilter("open")}
            >
              Open
            </button>
            <button
              className={`nav-pill ${statusFilter === "closed" ? "nav-pill--active" : ""}`}
              onClick={() => setStatusFilter("closed")}
            >
              Closed
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <select
              className="field-input"
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="all">All Environments</option>
              {environments.map(env => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>

            <select
              className="field-input"
              value={blueprintFilter}
              onChange={(e) => setBlueprintFilter(e.target.value)}
              style={{ flex: 1 }}
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
