import { useState } from "react";
import api from "../services/api";

/**
 * Custom hook for job actions (destroy, promote)
 * Handles API calls and modal state management
 */
export function useJobActions(refreshJobs) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "info",
    title: "",
    content: null
  });
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    job: null
  });
  const [promoteLoading, setPromoteLoading] = useState(false);

  /**
   * Show confirmation modal for resource deletion
   */
  const handleDelete = (job) => {
    setConfirmState({ isOpen: true, job });
  };

  /**
   * Confirm and execute resource deletion
   */
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

  /**
   * Handle resource promotion to next environment
   */
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
                Requires 1 approval and QA validation.
              </p>
            )}
            {result.targetEnvironment === "prod" && (
              <p style={{ marginTop: "8px", color: "#dc2626" }}>
                Requires 2 approvals and change control documentation.
              </p>
            )}
          </div>
        )
      });
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

  /**
   * Close the modal
   */
  const closeModal = () => {
    setModalState({ isOpen: false, type: "info", title: "", content: null });
  };

  /**
   * Close the confirmation dialog
   */
  const closeConfirm = () => {
    setConfirmState({ isOpen: false, job: null });
  };

  return {
    modalState,
    confirmState,
    promoteLoading,
    handleDelete,
    confirmDelete,
    handlePromote,
    closeModal,
    closeConfirm
  };
}
