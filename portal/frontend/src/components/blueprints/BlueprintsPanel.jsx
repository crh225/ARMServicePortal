import React from "react";
import { useBlueprints } from "../../hooks/useBlueprints";
import BlueprintsList from "./BlueprintsList";
import BlueprintsListSkeleton from "./BlueprintsListSkeleton";
import BlueprintForm from "./BlueprintForm";
import CostEstimate from "./CostEstimate";
import ResultPanel from "../jobs/ResultPanel";
import AuthModal from "../shared/AuthModal";

/**
 * Container component for the Blueprints tab
 * Handles all blueprints-related logic and state
 */
function BlueprintsPanel({ updateResourceData, onClearUpdate }) {
  const {
    blueprints,
    blueprintsLoading,
    selectedBlueprint,
    formValues,
    result,
    error,
    loading,
    policyErrors,
    showAuthModal,
    handleSelectBlueprint,
    handleFormChange,
    handleSubmit,
    handleCloseAuthModal
  } = useBlueprints(updateResourceData, onClearUpdate);

  return (
    <>
      {/* Show blueprint list full-width when no blueprint is selected */}
      {!selectedBlueprint && !updateResourceData && (
        <div className="panel panel--full">
          {blueprintsLoading ? (
            <BlueprintsListSkeleton />
          ) : (
            <BlueprintsList
              blueprints={blueprints}
              selectedBlueprint={selectedBlueprint}
              onSelectBlueprint={handleSelectBlueprint}
            />
          )}
        </div>
      )}

      {/* Show two-column layout when blueprint is selected */}
      {(selectedBlueprint || updateResourceData) && (
        <>
          <section className="panel panel--left">
            <BlueprintForm
              blueprint={selectedBlueprint}
              formValues={formValues}
              onChange={handleFormChange}
              onSubmit={handleSubmit}
              loading={loading}
              isUpdating={!!updateResourceData}
              policyErrors={policyErrors}
              onClearSelection={handleSelectBlueprint}
              hasResult={!!(result || error)}
            />
          </section>

          <aside className="panel panel--right">
            {updateResourceData && !result && (
              <>
                <div>
                  <h2 className="panel-title">Updating Resource</h2>
                  <p className="panel-help">
                    Modifying an existing deployed resource.
                  </p>
                </div>

                <div className="result-card">
                  <div className="result-row">
                    <span className="result-label">PR Number</span>
                    <span className="result-value">#{updateResourceData.number}</span>
                  </div>

                  <div className="result-row">
                    <span className="result-label">Title</span>
                    <span className="result-value">{updateResourceData.title}</span>
                  </div>

                  {updateResourceData.environment && (
                    <div className="result-row">
                      <span className="result-label">Environment</span>
                      <span className="result-value">{updateResourceData.environment}</span>
                    </div>
                  )}

                  {updateResourceData.moduleName && (
                    <div className="result-row">
                      <span className="result-label">Module Name</span>
                      <span className="result-value result-value--mono">{updateResourceData.moduleName}</span>
                    </div>
                  )}

                  {updateResourceData.pullRequestUrl && (
                    <div className="result-row">
                      <span className="result-label">Original PR</span>
                      <a
                        className="result-link"
                        href={updateResourceData.pullRequestUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on GitHub
                      </a>
                    </div>
                  )}

                  {updateResourceData.outputs && Object.keys(updateResourceData.outputs).length > 0 && (
                    <div className="result-row result-row--stacked">
                      <span className="result-label">Current Outputs</span>
                      <div className="result-value result-value--mono">
                        {Object.entries(updateResourceData.outputs).map(([key, obj]) => (
                          <div key={key}>
                            <strong>{key}</strong>:{" "}
                            {typeof obj === "object" && obj !== null && "value" in obj
                              ? String(obj.value)
                              : String(obj)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Show cost estimate when blueprint is selected */}
            {selectedBlueprint && !result && !error && (
              <CostEstimate blueprint={selectedBlueprint} formValues={formValues} />
            )}

            {/* Show Create/Update PR button when not showing results */}
            {selectedBlueprint && !result && !error && (
              <>
                <button
                  className="primary-btn primary-btn--large"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading
                    ? updateResourceData ? "Updating GitHub PR..." : "Creating GitHub PR..."
                    : updateResourceData ? "Update GitHub PR" : "Create GitHub PR"
                  }
                </button>

                <p className="hint-text">
                  The portal never applies Terraform directly. It just opens a
                  reviewed PR in your repo.
                </p>
              </>
            )}

            {/* Show results after PR creation/update */}
            {(result || error) && (
              <ResultPanel result={result} error={error} />
            )}
          </aside>
        </>
      )}

      <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} currentTab="blueprints" />
    </>
  );
}

export default BlueprintsPanel;
