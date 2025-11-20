import React from "react";

/**
 * Single log entry component
 * Displays one log line with timestamp and level
 */
function LogEntry({ log }) {
  const { timestamp, message, level } = log;

  // Format timestamp
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    : '';

  // Get level color
  const getLevelClass = (logLevel) => {
    switch (logLevel?.toLowerCase()) {
      case 'error':
        return 'log-level--error';
      case 'warning':
      case 'warn':
        return 'log-level--warning';
      case 'info':
        return 'log-level--info';
      default:
        return 'log-level--debug';
    }
  };

  return (
    <div className="log-entry">
      <span className="log-timestamp">{formattedTime}</span>
      <span className={`log-level ${getLevelClass(level)}`}>
        {level || 'INFO'}
      </span>
      <span className="log-message">{message}</span>
    </div>
  );
}

export default LogEntry;
