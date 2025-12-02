import React, { useEffect, useRef, useState, useCallback } from "react";
import "../../styles/BlueprintForm.css";
import { getEnvironmentConfig } from "../../config/environmentConfig";
import { fetchResourceGroups } from "../../services/resourcesApi";
import api from "../../services/api";

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
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [acrRepositories, setAcrRepositories] = useState([]);
  const [loadingAcrRepos, setLoadingAcrRepos] = useState(false);
  const [acrTags, setAcrTags] = useState({});
  const [loadingAcrTags, setLoadingAcrTags] = useState({});
  const [acrRegistry, setAcrRegistry] = useState("");

  // Get environment value and warning configuration
  const environment = formValues.environment || "dev";
  const envWarning = getEnvironmentConfig(environment);

  // Check if blueprint has ACR fields
  const hasAcrFields = blueprint?.variables?.some(
    v => v.type === "acr-repository" || v.type === "acr-tag"
  );

  // Fetch subscriptions on component mount
  useEffect(() => {
    const loadSubscriptions = async () => {
      setLoadingSubscriptions(true);
      try {
        const subs = await api.fetchSubscriptions();
        setSubscriptions(subs);

        // Auto-select first subscription if none selected and only one available
        if (!formValues.subscription_id && subs.length === 1) {
          onChange("subscription_id", subs[0].id);
        }
      } catch (error) {
        console.error("Failed to load subscriptions:", error);
        setSubscriptions([]);
      } finally {
        setLoadingSubscriptions(false);
      }
    };
    loadSubscriptions();
  }, []); // Only run once on mount

  // Fetch ACR repositories when blueprint has ACR fields
  useEffect(() => {
    if (!hasAcrFields) return;

    const loadAcrRepositories = async () => {
      setLoadingAcrRepos(true);
      try {
        const data = await api.fetchContainerRepositories();
        setAcrRepositories(data.repositories || []);
        setAcrRegistry(data.registry || "");
      } catch (error) {
        console.error("Failed to load ACR repositories:", error);
        setAcrRepositories([]);
      } finally {
        setLoadingAcrRepos(false);
      }
    };
    loadAcrRepositories();
  }, [hasAcrFields]);

  // Fetch tags when a repository is selected
  const loadTagsForRepo = useCallback(async (repoName) => {
    if (!repoName || acrTags[repoName]) return;

    setLoadingAcrTags(prev => ({ ...prev, [repoName]: true }));
    try {
      const data = await api.fetchContainerTags(repoName);
      setAcrTags(prev => ({ ...prev, [repoName]: data.tags || [] }));
    } catch (error) {
      console.error(`Failed to load tags for ${repoName}:`, error);
      setAcrTags(prev => ({ ...prev, [repoName]: [] }));
    } finally {
      setLoadingAcrTags(prev => ({ ...prev, [repoName]: false }));
    }
  }, [acrTags]);

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

  // Helper to extract repo name from full path
  const extractRepoName = (fullPath) => {
    if (!fullPath || !acrRegistry) return fullPath;
    return fullPath.replace(`${acrRegistry}/`, "");
  };

  // Helper to get repo name for tag field's dependent repo field
  const getRepoForTagField = (v) => {
    if (!v.dependsOn) return null;
    const repoValue = formValues[v.dependsOn];
    return extractRepoName(repoValue);
  };

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
            {blueprint.provider === "crossplane"
              ? "Specify values for your Crossplane application stack."
              : "Specify values for your Terraform module deployment."}
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
          // Check if this field should be hidden based on dependsOn/showWhen
          if (v.dependsOn && v.showWhen !== undefined) {
            const dependentValue = formValues[v.dependsOn];
            // Hide if the dependent field doesn't match showWhen value
            if (dependentValue !== v.showWhen) {
              return null;
            }
          }

          // Check if this is a resource_group_name or subscription_id field
          const isResourceGroupField = v.name === "resource_group_name";
          const isSubscriptionField = v.name === "subscription_id";
          const isAcrRepoField = v.type === "acr-repository";
          const isAcrTagField = v.type === "acr-tag";
          const shouldUseDynamicDropdown =
            (isResourceGroupField && resourceGroups.length > 0) ||
            (isSubscriptionField && subscriptions.length > 0);

          // For ACR tag fields, get the repository name from the dependent field
          const repoForTags = isAcrTagField ? getRepoForTagField(v) : null;
          const tagsForRepo = repoForTags ? acrTags[repoForTags] : null;
          const isLoadingTags = repoForTags ? loadingAcrTags[repoForTags] : false;

          // Load tags when repo is selected
          if (repoForTags && !tagsForRepo && !isLoadingTags) {
            loadTagsForRepo(repoForTags);
          }

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
                {isSubscriptionField && loadingSubscriptions && (
                  <span className="field-loading"> (loading...)</span>
                )}
                {isAcrRepoField && loadingAcrRepos && (
                  <span className="field-loading"> (loading...)</span>
                )}
                {isAcrTagField && isLoadingTags && (
                  <span className="field-loading"> (loading...)</span>
                )}
              </label>

              {/* ACR Repository field - combobox style */}
              {isAcrRepoField ? (
                <div className="acr-field-wrapper">
                  <select
                    className="field-input"
                    value={formValues[v.name] || ""}
                    onChange={(e) => {
                      onChange(v.name, e.target.value);
                      // Clear dependent tag field when repo changes
                      const tagField = blueprint.variables.find(
                        f => f.type === "acr-tag" && f.dependsOn === v.name
                      );
                      if (tagField) {
                        onChange(tagField.name, "latest");
                      }
                    }}
                    disabled={loadingAcrRepos}
                  >
                    <option value="">-- Select from registry --</option>
                    {acrRepositories.map((repo) => (
                      <option key={repo.name} value={repo.fullPath}>
                        {repo.name}
                      </option>
                    ))}
                  </select>
                  {v.helpText && (
                    <span className="field-help">{v.helpText}</span>
                  )}
                  {acrRegistry && (
                    <span className="acr-registry-hint">Registry: {acrRegistry}</span>
                  )}
                </div>
              ) : isAcrTagField ? (
                <div className="acr-field-wrapper">
                  <select
                    className="field-input"
                    value={formValues[v.name] || "latest"}
                    onChange={(e) => onChange(v.name, e.target.value)}
                    disabled={!repoForTags || isLoadingTags}
                  >
                    <option value="latest">latest</option>
                    {tagsForRepo && tagsForRepo
                      .filter(t => t.name !== "latest")
                      .map((tag) => (
                        <option key={tag.name} value={tag.name}>
                          {tag.name}
                        </option>
                      ))}
                  </select>
                  {!repoForTags && (
                    <span className="field-help">Select a repository first</span>
                  )}
                </div>
              ) : v.type === "select" || shouldUseDynamicDropdown ? (
                <select
                  className="field-input"
                  value={formValues[v.name] || ""}
                  onChange={(e) => onChange(v.name, e.target.value)}
                  disabled={
                    (loadingResourceGroups && isResourceGroupField) ||
                    (loadingSubscriptions && isSubscriptionField)
                  }
                >
                  <option value="">-- Select --</option>
                  {isSubscriptionField && shouldUseDynamicDropdown ? (
                    subscriptions.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))
                  ) : shouldUseDynamicDropdown ? (
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
                  placeholder={isResourceGroupField ? "Or type a resource group name" : isSubscriptionField ? "Or paste a subscription ID" : v.placeholder || ""}
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
