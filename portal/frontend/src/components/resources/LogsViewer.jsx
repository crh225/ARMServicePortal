import React, { useState, useEffect } from "react";
import LogEntry from "./LogEntry";
import LogsControls from "./LogsControls";
import { exportLogsToCSV } from "../../utils/csvExport";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

/**
 * Logs Viewer Component
 * Fetches and displays logs for a resource
 */
function LogsViewer({ resource }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [supported, setSupported] = useState(true);
  const [tail, setTail] = useState(100);
  const [timeRange, setTimeRange] = useState('1h');

  // Fetch logs
  const fetchLogs = async () => {
    if (!resource?.id) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        resourceId: resource.id,
        tail: tail.toString(),
        timeRange
      });

      const response = await fetch(`${API_BASE_URL}/api/logs?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch logs: ${response.statusText}`);
      }

      const data = await response.json();

      setSupported(data.supported);
      setLogs(data.logs || []);

      if (!data.supported) {
        setError(data.message || 'Logs not supported for this resource type');
      }

    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch logs on mount and when parameters change
  useEffect(() => {
    fetchLogs();
  }, [resource?.id, tail, timeRange]);

  // Download logs as CSV
  const handleDownloadCSV = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${resource.name}-logs-${timestamp}.csv`;
    exportLogsToCSV(logs, filename);
  };

  if (loading && logs.length === 0) {
    return <div className="logs-loading">Loading logs...</div>;
  }

  if (error && !supported) {
    return <div className="logs-error">{error}</div>;
  }

  return (
    <div className="logs-viewer">
      <LogsControls
        tail={tail}
        timeRange={timeRange}
        onTailChange={setTail}
        onTimeRangeChange={setTimeRange}
        onRefresh={fetchLogs}
        onDownloadCSV={handleDownloadCSV}
        isLoading={loading}
      />

      {logs.length === 0 ? (
        <div className="logs-empty">No logs found</div>
      ) : (
        <div className="logs-list">
          {logs.map((log, index) => (
            <LogEntry key={index} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

export default LogsViewer;
