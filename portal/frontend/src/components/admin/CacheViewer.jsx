import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import "../../styles/CacheViewer.css";

function CacheViewer() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(new Set());
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

  const handleDeleteGroup = async (groupKey, groupEntries) => {
    if (!window.confirm(`Delete all ${groupEntries.length} entries in "${groupKey}"?`)) return;

    try {
      for (const entry of groupEntries) {
        await api.deleteCacheEntry(entry.key);
      }
      const keysToDelete = new Set(groupEntries.map(e => e.key));
      setEntries(entries.filter(e => !keysToDelete.has(e.key)));
      setExpandedGroups(prev => {
        const next = new Set(prev);
        next.delete(groupKey);
        return next;
      });
    } catch (err) {
      console.error("Failed to delete group:", err);
      alert(`Failed to delete group: ${err.message}`);
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

  // Group entries by prefix (first part before colon)
  const groupedEntries = useMemo(() => {
    const filtered = entries.filter(entry =>
      entry.key.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groups = new Map();

    filtered.forEach(entry => {
      const colonIndex = entry.key.indexOf(":");
      const prefix = colonIndex > 0 ? entry.key.substring(0, colonIndex) : entry.key;
      const suffix = colonIndex > 0 ? entry.key.substring(colonIndex + 1) : null;

      if (!groups.has(prefix)) {
        groups.set(prefix, {
          prefix,
          entries: [],
          totalSize: 0,
          minTTL: Infinity
        });
      }

      const group = groups.get(prefix);
      group.entries.push({ ...entry, suffix });
      group.totalSize += entry.size;
      if (entry.ttl > 0 && entry.ttl < group.minTTL) {
        group.minTTL = entry.ttl;
      }
    });

    // Sort groups by prefix
    return Array.from(groups.values()).sort((a, b) => a.prefix.localeCompare(b.prefix));
  }, [entries, searchTerm]);

  const toggleGroup = (prefix) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(prefix)) {
        next.delete(prefix);
      } else {
        next.add(prefix);
      }
      return next;
    });
  };

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

  const totalEntries = groupedEntries.reduce((sum, g) => sum + g.entries.length, 0);

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
        <span className="cache-count">{totalEntries} entries</span>
        <span className="cache-count">{groupedEntries.length} groups</span>
        <span className="cache-size">{formatSize(totalSize)}</span>
      </div>

      {groupedEntries.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? `No entries matching "${searchTerm}"` : "No cache entries"}
        </div>
      ) : (
        <div className="cache-tree">
          {groupedEntries.map((group) => (
            <div key={group.prefix} className="cache-group">
              <div
                className="cache-group-header"
                onClick={() => toggleGroup(group.prefix)}
              >
                <div className="cache-group-key">
                  <span className="expand-icon">
                    {expandedGroups.has(group.prefix) ? "▼" : "▶"}
                  </span>
                  <code className="cache-group-prefix">{group.prefix}</code>
                  <span className="cache-group-count">({group.entries.length})</span>
                </div>
                <div className="cache-group-meta">
                  <span className="cache-entry-size">{formatSize(group.totalSize)}</span>
                  {group.minTTL < Infinity && (
                    <span className={`cache-entry-ttl ${group.minTTL <= 60 ? "expiring-soon" : ""}`}>
                      {formatTTL(group.minTTL)}
                    </span>
                  )}
                  <button
                    className="btn-delete-entry"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(group.prefix, group.entries);
                    }}
                    title={`Delete all ${group.entries.length} entries`}
                  >
                    ×
                  </button>
                </div>
              </div>

              {expandedGroups.has(group.prefix) && (
                <div className="cache-group-entries">
                  {group.entries.map((entry) => (
                    <div key={entry.key} className="cache-entry cache-entry--nested">
                      <div
                        className="cache-entry-header"
                        onClick={() => setExpandedKey(expandedKey === entry.key ? null : entry.key)}
                      >
                        <div className="cache-entry-key">
                          <span className="expand-icon">{expandedKey === entry.key ? "▼" : "▶"}</span>
                          <code>{entry.suffix || entry.key}</code>
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
          ))}
        </div>
      )}
    </div>
  );
}

export default CacheViewer;
