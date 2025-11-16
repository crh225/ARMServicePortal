import { useState, useEffect } from "react";
import api from "../services/api";

/**
 * Custom hook for managing blueprint state and operations
 */
export function useBlueprints() {
  const [blueprints, setBlueprints] = useState([]);
  const [selectedBlueprint, setSelectedBlueprint] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  // Handle blueprint selection
  const handleSelectBlueprint = (id) => {
    const bp = blueprints.find((b) => b.id === id) || null;
    setSelectedBlueprint(bp);
    setResult(null);
    setError(null);

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
        formValues
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
