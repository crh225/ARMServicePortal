import { useState, useEffect } from "react";
import api from "../services/api";

/**
 * Parse variables from Terraform module code
 */
function parseTerraformVariables(terraformModule) {
  if (!terraformModule) return {};

  const variables = {};
  // Match patterns like: variable_name = "value" or variable_name = value
  const regex = /(\w+)\s*=\s*"([^"]*)"|(\w+)\s*=\s*([^\s\n]+)/g;
  let match;

  while ((match = regex.exec(terraformModule)) !== null) {
    const key = match[1] || match[3];
    const value = match[2] || match[4];
    variables[key] = value;
  }

  return variables;
}

/**
 * Custom hook for managing blueprint state and operations
 */
export function useBlueprints(updateResourceData, onClearUpdate) {
  const [blueprints, setBlueprints] = useState([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moduleName, setModuleName] = useState(null);
  const [policyErrors, setPolicyErrors] = useState(null);

  // Load blueprints on mount
  useEffect(() => {
    const loadBlueprints = async () => {
      try {
        const data = await api.fetchBlueprints();
        setBlueprints(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load blueprints");
      }
    };
    loadBlueprints();
  }, []);

  // Handle update resource data
  useEffect(() => {
    if (updateResourceData && blueprints.length > 0) {
      const blueprintId = updateResourceData.blueprintId;
      if (blueprintId) {
        const bp = blueprints.find((b) => b.id === blueprintId);
        if (bp) {
          setSelectedBlueprint(bp);

          // Parse variables from Terraform module
          const parsedVars = parseTerraformVariables(updateResourceData.terraformModule);
          setFormValues(parsedVars);

          // Store the module name to lock it during update
          setModuleName(updateResourceData.moduleName);

          // Clear any previous results/errors when starting an update
          setResult(null);
          setError(null);
          setPolicyErrors(null);

          // Don't call onUpdateComplete here - let the parent keep updateResourceData
          // It will be cleared when a new result comes in or user selects a different blueprint
        }
      }
    }
  }, [updateResourceData, blueprints]);

  // Handle blueprint selection
  const handleSelectBlueprint = (id) => {
    const bp = blueprints.find((b) => b.id === id) || null;
    setSelectedBlueprint(bp);
    setResult(null);
    setError(null);
    setModuleName(null); // Clear module name when selecting a new blueprint
    setPolicyErrors(null);

    // Clear update resource data when user manually selects a blueprint
    if (onClearUpdate) {
      onClearUpdate();
    }

    if (bp) {
      const initial = {};
      (bp.variables || []).forEach((v) => {
        initial[v.name] = v.default || "";
      });
      setFormValues(initial);
    } else {
      setFormValues({});
    }
  };

  // Handle form field changes
  const handleFormChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // Submit provision request
  const handleSubmit = async () => {
    if (!selectedBlueprint) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setPolicyErrors(null);

    try {
      const data = await api.provisionBlueprint(
        selectedBlueprint.id,
        formValues,
        moduleName // Pass module name for updates, null for new provisions
      );

      if (data.error) {
        setError(data.error);
        // Check for policy errors
        if (data.policyErrors) {
          setPolicyErrors(data.policyErrors);
        }
      } else {
        setResult({
          status: data.status,
          pullRequestUrl: data.pullRequestUrl,
          branchName: data.branchName,
          filePath: data.filePath,
          policyWarnings: data.policyWarnings
        });

        // Reset the form to force user to select a blueprint again
        setSelectedBlueprint(null);
        setFormValues({});
        setModuleName(null);

        // Clear update resource data so they can start fresh
        if (onClearUpdate) {
          onClearUpdate();
        }
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err.message || "Failed to submit request";
      setError(errorMessage);

      // Try to parse policy errors from error response
      try {
        const errorData = JSON.parse(errorMessage);
        if (errorData.policyErrors) {
          setPolicyErrors(errorData.policyErrors);
        }
      } catch {
        // Not JSON, ignore
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    blueprints,
    selectedBlueprint,
    formValues,
    result,
    error,
    loading,
    policyErrors,
    handleSelectBlueprint,
    handleFormChange,
    handleSubmit
  };
}
