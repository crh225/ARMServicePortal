import React from "react";
import ResultRow from "./ResultRow";

/**
 * Component for displaying Terraform outputs
 */
function TerraformOutputs({ outputs, loading, error }) {
  if (loading) {
    return <ResultRow label="Outputs" value="Loading outputs…" />;
  }

  if (error) {
    return (
      <div className="alert alert--error">
        <strong>Error loading outputs:</strong> {error}
      </div>
    );
  }

  if (!outputs || Object.keys(outputs).length === 0) {
    return null;
  }

  const outputElements = Object.entries(outputs).map(([key, obj]) => {
    const value =
      typeof obj === "object" && obj !== null && "value" in obj
        ? String(obj.value)
        : String(obj);

    return (
      <div key={key}>
        <strong>{key}</strong>: {value}
      </div>
    );
  });

  return (
    <ResultRow
      label="Terraform Outputs"
      stacked
      value={<div className="result-value result-value--mono">{outputElements}</div>}
    />
  );
}

export default TerraformOutputs;
