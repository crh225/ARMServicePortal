import React from "react";

/**
 * Controls for the logs viewer
 * Handles filters, refresh, and actions
 */
function LogsControls({ tail, timeRange, onTailChange, onTimeRangeChange, onRefresh, onDownloadCSV, isLoading }) {
  return (
    <div className="logs-controls">
      <div className="logs-controls-left">
        {/* Tail selector */}
        <label className="control-label">
          Lines:
          <select
            className="control-select"
            value={tail}
            onChange={(e) => onTailChange(parseInt(e.target.value, 10))}
            disabled={isLoading}
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
            <option value={1000}>1000</option>
          </select>
        </label>

        {/* Time range selector */}
        <label className="control-label">
          Time Range:
          <select
            className="control-select"
            value={timeRange}
            onChange={(e) => onTimeRangeChange(e.target.value)}
            disabled={isLoading}
          >
            <option value="15m">Last 15 minutes</option>
            <option value="1h">Last hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>
        </label>
      </div>

      <div className="logs-controls-right">
        {/* Download CSV button */}
        <button
          className="refresh-btn"
          onClick={onDownloadCSV}
          disabled={isLoading}
          title="Download logs as CSV"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 12L3 7h3V1h4v6h3l-5 5z"/>
            <path d="M14 14H2v-2h12v2z"/>
          </svg>
        </button>

        {/* Refresh button */}
        <button
          className={`refresh-btn ${isLoading ? 'refresh-btn--loading' : ''}`}
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh logs"
        >
          ↻
        </button>
      </div>
    </div>
  );
}

export default LogsControls;
