import React from "react";
import "../styles/BlueprintForm.css";

function BlueprintForm({
  blueprint,
  formValues,
  onChange,
  onSubmit,
  loading
}) {
  if (!blueprint) return null;

  return (
    <div className="panel panel--form">
      <h2 className="panel-title">2. Parameters</h2>
      <p className="panel-help">
        Values will be written into a Terraform module file in GitHub.
      </p>

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
              />
            )}
          </div>
        ))}
      </div>

      <button
        className="primary-btn"
        onClick={onSubmit}
        disabled={loading}
      >
        {loading ? "Creating GitHub PR..." : "Create GitHub PR"}
      </button>

      <p className="hint-text">
        The portal never applies Terraform directly. It just opens a
        reviewed PR in your repo.
      </p>
    </div>
  );
}

export default BlueprintForm;
