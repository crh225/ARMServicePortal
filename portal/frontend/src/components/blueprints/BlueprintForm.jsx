import React, { useEffect, useRef } from "react";
import "../../styles/BlueprintForm.css";
import { getEnvironmentConfig } from "../../config/environmentConfig";

function BlueprintForm({
  blueprint,
  formValues,
  onChange,
  onSubmit,
  loading,
  isUpdating,
  policyErrors,
  onClearSelection,
  hasResult
}) {
  const formRef = useRef(null);

  // Scroll form into view when blueprint changes
  useEffect(() => {
    if (blueprint && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [blueprint?.id]);

  if (!blueprint) return null;

  // Get environment value and warning configuration
  const environment = formValues.environment || "dev";
  const envWarning = getEnvironmentConfig(environment);

  return (
    <div ref={formRef}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <h2 className="panel-title">{blueprint.displayName}</h2>
          <p className="panel-help">{blueprint.description}</p>
        </div>
        {onClearSelection && (
          <button
            className="reset-btn"
            onClick={() => onClearSelection(null)}
          >
            {hasResult ? "Create Blueprint" : "← Start Over"}
          </button>
        )}
      </div>

      <div className="panel panel--form">
        <div>
          <h2 className="panel-title">Configure Parameters</h2>
          <p className="panel-help">
            Specify values for your Terraform module deployment.
          </p>
        </div>

      {envWarning && (
        <div className={`environment-warning environment-warning--${envWarning.level}`}>
          <div className="environment-warning__header">
            <span className="environment-warning__title">{envWarning.title}</span>
          </div>
          <div className="environment-warning__message">{envWarning.message}</div>
        </div>
      )}

      {policyErrors && policyErrors.length > 0 && (
        <div className="policy-errors">
          <div className="policy-errors__title">Policy Violations</div>
          {policyErrors.map((error, idx) => (
            <div key={idx} className="policy-errors__item">
              <strong>{error.field}:</strong> {error.message}
            </div>
          ))}
        </div>
      )}

      <div className="form-grid">
        {(blueprint.variables || []).map((v) => (
          <div key={v.name} className="form-field">
            <label className="field-label">
              {v.label}
              {v.required && (
                <span className="field-required">*</span>
              )}
            </label>
            {v.type === "select" ? (
              <select
                className="field-input"
                value={formValues[v.name] || ""}
                onChange={(e) => onChange(v.name, e.target.value)}
              >
                <option value="">-- Select --</option>
                {(v.options || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="field-input"
                type="text"
                value={formValues[v.name] || ""}
                onChange={(e) =>
                  onChange(v.name, e.target.value)
                }
                disabled={isUpdating && v.name === "project_name"}
                title={isUpdating && v.name === "project_name" ? "Resource name cannot be changed when updating" : ""}
              />
            )}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

export default BlueprintForm;
