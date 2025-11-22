import React, { useEffect, useRef, useState, useCallback } from "react";
import "../../styles/BlueprintForm.css";
import { getEnvironmentConfig } from "../../config/environmentConfig";
import { fetchResourceGroups } from "../../services/resourcesApi";

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
  const [resourceGroups, setResourceGroups] = useState([]);
  const [loadingResourceGroups, setLoadingResourceGroups] = useState(false);

  // Get environment value and warning configuration
  const environment = formValues.environment || "dev";
  const envWarning = getEnvironmentConfig(environment);

  // Fetch resource groups when environment changes
  const loadResourceGroups = useCallback(async (env) => {
    if (!env) return;

    setLoadingResourceGroups(true);
    try {
      const rgs = await fetchResourceGroups(env);
      setResourceGroups(rgs);
    } catch (error) {
      console.error("Failed to load resource groups:", error);
      setResourceGroups([]);
    } finally {
      setLoadingResourceGroups(false);
    }
  }, []);

  // Load resource groups when environment changes
  useEffect(() => {
    loadResourceGroups(environment);
  }, [environment, loadResourceGroups]);

  // Scroll form into view when blueprint changes
  useEffect(() => {
    if (blueprint && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [blueprint?.id]);

  if (!blueprint) return null;

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
        {(blueprint.variables || []).map((v) => {
          // Check if this is a resource_group_name field
          const isResourceGroupField = v.name === "resource_group_name";
          const shouldUseDynamicDropdown = isResourceGroupField && resourceGroups.length > 0;

          return (
            <div key={v.name} className="form-field">
              <label className="field-label">
                {v.label}
                {v.required && (
                  <span className="field-required">*</span>
                )}
                {isResourceGroupField && loadingResourceGroups && (
                  <span className="field-loading"> (loading...)</span>
                )}
              </label>
              {v.type === "select" || shouldUseDynamicDropdown ? (
                <select
                  className="field-input"
                  value={formValues[v.name] || ""}
                  onChange={(e) => onChange(v.name, e.target.value)}
                  disabled={loadingResourceGroups && isResourceGroupField}
                >
                  <option value="">-- Select --</option>
                  {shouldUseDynamicDropdown ? (
                    resourceGroups.map((rg) => (
                      <option key={rg} value={rg}>
                        {rg}
                      </option>
                    ))
                  ) : (
                    (v.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))
                  )}
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
                  placeholder={isResourceGroupField ? "Or type a resource group name" : ""}
                />
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}

export default BlueprintForm;
