import React from "react";
import CostEstimate from "./CostEstimate";
import "../styles/BlueprintForm.css";

function BlueprintForm({
  blueprint,
  formValues,
  onChange,
  onSubmit,
  loading,
  isUpdating,
  policyErrors
}) {
  if (!blueprint) return null;

  // Get environment value
  const environment = formValues.environment || "dev";

  // Environment-specific warnings
  const getEnvironmentWarning = (env) => {
    const warnings = {
      qa: {
        level: "warning",
        icon: "⚠️",
        title: "QA Environment",
        message: "This deployment requires 1 approval before merging to main."
      },
      staging: {
        level: "warning",
        icon: "⚠️",
        title: "Staging Environment",
        message: "This deployment requires 1 approval and should match QA tested configuration."
      },
      prod: {
        level: "critical",
        icon: "🔴",
        title: "Production Environment",
        message: "This deployment requires 2 approvals and change control documentation."
      }
    };
    return warnings[env] || null;
  };

  const envWarning = getEnvironmentWarning(environment);

  return (
    <div className="panel panel--form">
      <h2 className="panel-title">2. Parameters</h2>
      <p className="panel-help">
        Values will be written into a Terraform module file in GitHub.
      </p>

      {envWarning && (
        <div className={`environment-warning environment-warning--${envWarning.level}`}>
          <div className="environment-warning__header">
            <span className="environment-warning__icon">{envWarning.icon}</span>
            <span className="environment-warning__title">{envWarning.title}</span>
          </div>
          <div className="environment-warning__message">{envWarning.message}</div>
        </div>
      )}

      {policyErrors && policyErrors.length > 0 && (
        <div className="policy-errors">
          <div className="policy-errors__title">⚠️ Policy Violations</div>
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

      <CostEstimate blueprint={blueprint} formValues={formValues} />

      <button
        className="primary-btn"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading
          ? (isUpdating ? "Updating Blueprint..." : "Creating GitHub PR...")
          : (isUpdating ? "Update Blueprint" : "Create GitHub PR")
        }
      </button>

      <p className="hint-text">
        The portal never applies Terraform directly. It just opens a
        reviewed PR in your repo.
      </p>
    </div>
  );
}

export default BlueprintForm;
