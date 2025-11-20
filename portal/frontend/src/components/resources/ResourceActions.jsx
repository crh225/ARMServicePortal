import React from "react";

/**
 * Component for resource management actions (promote, update, delete)
 */
function ResourceActions({ job, onPromote, onUpdate, onDelete, promoteLoading }) {
  const isDeployed = job.merged && job.status === "merged";
  const canManageResource = isDeployed && job.resourceExists;

  if (!canManageResource) {
    return null;
  }

  // Determine next environment for promotion
  const environmentPath = {
    dev: "qa",
    qa: "staging",
    staging: "prod",
    prod: null
  };
  const nextEnvironment = environmentPath[job.environment];
  const canPromote = nextEnvironment !== null;

  return (
    <div className="resource-actions">
      {canPromote && (
        <button
          className="resource-btn resource-btn--promote"
          onClick={() => onPromote && onPromote(job)}
          disabled={promoteLoading}
        >
          {promoteLoading ? "Promoting..." : `Promote to ${nextEnvironment}`}
        </button>
      )}
      <button
        className="resource-btn resource-btn--update"
        onClick={() => onUpdate && onUpdate(job)}
        disabled={promoteLoading}
      >
        Update Resource
      </button>
      <button
        className="resource-btn resource-btn--delete"
        onClick={() => onDelete && onDelete(job)}
        disabled={promoteLoading}
      >
        Delete Resource
      </button>
    </div>
  );
}

export default ResourceActions;
