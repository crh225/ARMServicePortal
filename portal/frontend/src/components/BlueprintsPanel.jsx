import React from "react";
import { useBlueprints } from "../hooks/useBlueprints";
import BlueprintsList from "./BlueprintsList";
import BlueprintForm from "./BlueprintForm";
import ResultPanel from "./ResultPanel";
import Terminal from "./Terminal";
import AuthModal from "./AuthModal";

/**
 * Container component for the Blueprints tab
 * Handles all blueprints-related logic and state
 */
function BlueprintsPanel({ updateResourceData, onClearUpdate }) {
  const {
    blueprints,
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
      <section className="panel panel--left">
        <BlueprintsList
          blueprints={blueprints}
          selectedBlueprint={selectedBlueprint}
          onSelectBlueprint={handleSelectBlueprint}
        />

        <BlueprintForm
          blueprint={selectedBlueprint}
          formValues={formValues}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
          loading={loading}
          isUpdating={!!updateResourceData}
          policyErrors={policyErrors}
        />
      </section>

      <aside className="panel panel--right">
        {updateResourceData && !result ? (
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
        ) : (
          <>
            <ResultPanel result={result} error={error} />
            <Terminal result={result} />
          </>
        )}
      </aside>

      <AuthModal isOpen={showAuthModal} onClose={handleCloseAuthModal} />
    </>
  );
}

export default BlueprintsPanel;
