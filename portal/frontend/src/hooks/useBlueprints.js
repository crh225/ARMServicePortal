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
export function useBlueprints(updateResourceData, onUpdateComplete) {
  const [blueprints, setBlueprints] = useState([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [moduleName, setModuleName] = useState(null);

  // Load blueprints on mount
  useEffect(() => {
    api
      .fetchBlueprints()
      .then(setBlueprints)
      .catch((err) => {
        console.error(err);
        setError("Failed to load blueprints");
      });
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

          if (onUpdateComplete) {
            onUpdateComplete();
          }
        }
      }
    }
  }, [updateResourceData, blueprints, onUpdateComplete]);

  // Handle blueprint selection
  const handleSelectBlueprint = (id) => {
    const bp = blueprints.find((b) => b.id === id) || null;
    setSelectedBlueprint(bp);
    setResult(null);
    setError(null);
    setModuleName(null); // Clear module name when selecting a new blueprint

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

    try {
      const data = await api.provisionBlueprint(
        selectedBlueprint.id,
        formValues,
        moduleName // Pass module name for updates, null for new provisions
      );

      if (data.error) {
        setError(data.error);
      } else {
        setResult({
          status: data.status,
          pullRequestUrl: data.pullRequestUrl,
          branchName: data.branchName,
          filePath: data.filePath
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to submit request");
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
    handleSelectBlueprint,
    handleFormChange,
    handleSubmit
  };
}
