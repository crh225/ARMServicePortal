import React from "react";

/**
 * Reusable component for displaying key-value pairs
 */
function ResultRow({ label, value, stacked = false, className = "" }) {
  const rowClass = `result-row${stacked ? " result-row--stacked" : ""} ${className}`.trim();

  return (
    <div className={rowClass}>
      <span className="result-label">{label}</span>
      {typeof value === 'string' ? (
        <span className="result-value">{value}</span>
      ) : (
        value
      )}
    </div>
  );
}

export default ResultRow;
