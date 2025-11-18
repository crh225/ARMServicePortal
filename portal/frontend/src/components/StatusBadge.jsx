import React from "react";

/**
 * Reusable badge component for status display
 */
function StatusBadge({ status, label }) {
  const badgeStatus = status || "unknown";

  return (
    <span className={`badge badge--${badgeStatus}`}>
      {label || badgeStatus}
    </span>
  );
}

export default StatusBadge;
