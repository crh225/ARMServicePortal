import React from "react";
import EmptyState from "./EmptyState";
import "../styles/BlueprintsList.css";

function BlueprintsList({ blueprints, selectedBlueprint, onSelectBlueprint }) {
  return (
    <div>
      <div>
        <h2 className="panel-title">1. Choose a Blueprint</h2>
        <p className="panel-help">
          These are your approved Terraform-backed building blocks.
        </p>
      </div>

      <div className="blueprint-list">
        {blueprints.map((bp) => (
          <button
            key={bp.id}
            className={
              "blueprint-card" +
              (selectedBlueprint?.id === bp.id
                ? " blueprint-card--active"
                : "")
            }
            onClick={() => onSelectBlueprint(bp.id)}
          >
            <h3 className="blueprint-title">{bp.displayName}</h3>
            <p className="blueprint-desc">{bp.description}</p>
          </button>
        ))}

        {blueprints.length === 0 && (
          <EmptyState
            message="No blueprints found yet."
            subMessage="Add modules in the infra folder and expose them via the API."
          />
        )}
      </div>
    </div>
  );
}

export default BlueprintsList;
