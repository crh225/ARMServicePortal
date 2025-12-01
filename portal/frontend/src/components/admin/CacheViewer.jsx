import { useState, useEffect } from "react";
import api from "../../services/api";
import "../../styles/CacheViewer.css";

function CacheViewer() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedKey, setExpandedKey] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalSize, setTotalSize] = useState(0);
  const [usingRedis, setUsingRedis] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.getCacheEntries();
      setEntries(data.entries || []);
      setTotalSize(data.totalSize || 0);
      setUsingRedis(data.usingRedis || false);
    } catch (err) {
      console.error("Failed to load cache entries:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm(`Delete cache entry "${key}"?`)) return;

    try {
      await api.deleteCacheEntry(key);
      setEntries(entries.filter(e => e.key !== key));
      if (expandedKey === key) setExpandedKey(null);
    } catch (err) {
      console.error("Failed to delete cache entry:", err);
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatTTL = (ttl) => {
    if (ttl === -1) return "No expiry";
    if (ttl === -2) return "Expired";
    if (ttl < 60) return `${ttl}s`;
    if (ttl < 3600) return `${Math.floor(ttl / 60)}m ${ttl % 60}s`;
    const hours = Math.floor(ttl / 3600);
    const mins = Math.floor((ttl % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const getValuePreview = (value) => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        return `Array(${value.length})`;
      }
      const keys = Object.keys(value);
      if (keys.length <= 3) {
        return `{ ${keys.join(", ")} }`;
      }
      return `{ ${keys.slice(0, 3).join(", ")}, ... }`;
    }
    const str = String(value);
    return str.length > 50 ? str.substring(0, 50) + "..." : str;
  };

  const filteredEntries = entries.filter(entry =>
    entry.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="admin-section">
        <h3>Cache Viewer</h3>
        <div className="cache-loading">
          <div className="skeleton-line" style={{ width: "100%", height: "40px", marginBottom: "8px" }}></div>
          <div className="skeleton-line" style={{ width: "100%", height: "40px", marginBottom: "8px" }}></div>
          <div className="skeleton-line" style={{ width: "100%", height: "40px", marginBottom: "8px" }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-section">
        <h3>Cache Viewer</h3>
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="cache-header">
        <h3>Cache Viewer</h3>
        <div className="cache-controls">
          <input
            type="text"
            placeholder="Search keys..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cache-search"
          />
          <button onClick={loadEntries} className="btn-refresh" title="Refresh">
            ↻
          </button>
        </div>
      </div>

      <div className="cache-stats-bar">
        <span className={`cache-backend ${usingRedis ? "redis" : "memory"}`}>
          {usingRedis ? "Redis" : "In-Memory"}
        </span>
        <span className="cache-count">{filteredEntries.length} entries</span>
        <span className="cache-size">{formatSize(totalSize)}</span>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? `No entries matching "${searchTerm}"` : "No cache entries"}
        </div>
      ) : (
        <div className="cache-entries">
          {filteredEntries.map((entry) => (
            <div key={entry.key} className="cache-entry">
              <div
                className="cache-entry-header"
                onClick={() => setExpandedKey(expandedKey === entry.key ? null : entry.key)}
              >
                <div className="cache-entry-key">
                  <span className="expand-icon">{expandedKey === entry.key ? "▼" : "▶"}</span>
                  <code>{entry.key}</code>
                </div>
                <div className="cache-entry-meta">
                  <span className="cache-entry-preview">{getValuePreview(entry.value)}</span>
                  <span className="cache-entry-size">{formatSize(entry.size)}</span>
                  <span className={`cache-entry-ttl ${entry.ttl <= 60 ? "expiring-soon" : ""}`}>
                    {formatTTL(entry.ttl)}
                  </span>
                  <button
                    className="btn-delete-entry"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(entry.key);
                    }}
                    title="Delete entry"
                  >
                    ×
                  </button>
                </div>
              </div>
              {expandedKey === entry.key && (
                <div className="cache-entry-value">
                  <pre>{formatValue(entry.value)}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CacheViewer;
