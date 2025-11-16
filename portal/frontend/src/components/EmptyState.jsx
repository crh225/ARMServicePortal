import React from "react";
import "../styles/EmptyState.css";

function EmptyState({ message, subMessage }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {subMessage && <p className="empty-state-sub">{subMessage}</p>}
    </div>
  );
}

export default EmptyState;
