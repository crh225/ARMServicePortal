import React from "react";
import { useBlueprints } from "../hooks/useBlueprints";
import BlueprintsList from "./BlueprintsList";
import BlueprintForm from "./BlueprintForm";
import ResultPanel from "./ResultPanel";
import Terminal from "./Terminal";

/**
 * Container component for the Blueprints tab
 * Handles all blueprints-related logic and state
 */
function BlueprintsPanel() {
  const {
    blueprints,
    selectedBlueprint,
    formValues,
    result,
    error,
    loading,
    handleSelectBlueprint,
    handleFormChange,
    handleSubmit
  } = useBlueprints();

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
        />
      </section>

      <aside className="panel panel--right">
        <ResultPanel result={result} error={error} />
        <Terminal result={result} />
      </aside>
    </>
  );
}

export default BlueprintsPanel;
