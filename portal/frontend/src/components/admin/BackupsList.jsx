import { useState, useEffect } from "react";
import api from "../../services/api";
import "../../styles/AdminPanel.css";
import "../../styles/BackupsList.css";

function BackupsList() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [environmentFilter, setEnvironmentFilter] = useState("all");

  useEffect(() => {
    loadBackups();
  }, [environmentFilter]);

  const loadBackups = async () => {
    setLoading(true);
    setError(null);

    try {
      const env = environmentFilter === "all" ? null : environmentFilter;
      const data = await api.fetchBackups(env);
      setBackups(data);
    } catch (err) {
      console.error("Failed to load backups:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "Unknown";
    // Parse timestamp format: 20250123-143022
    const year = timestamp.substring(0, 4);
    const month = timestamp.substring(4, 6);
    const day = timestamp.substring(6, 8);
    const hour = timestamp.substring(9, 11);
    const minute = timestamp.substring(11, 13);
    const second = timestamp.substring(13, 15);

    const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    return date.toLocaleString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateExpirationDate = (createdDate) => {
    const created = new Date(createdDate);
    const expiration = new Date(created);
    expiration.setDate(expiration.getDate() + 30);
    return expiration;
  };

  const isExpired = (createdDate) => {
    const expiration = calculateExpirationDate(createdDate);
    return expiration < new Date();
  };

  const getDaysUntilExpiration = (createdDate) => {
    const expiration = calculateExpirationDate(createdDate);
    const now = new Date();
    const daysLeft = Math.ceil((expiration - now) / (1000 * 60 * 60 * 24));
    return daysLeft;
  };

  const getBackupTypeLabel = (type) => {
    switch (type) {
      case "backup":
        return "Automated Backup";
      case "pre-restore":
        return "Pre-Restore Backup";
      default:
        return "Unknown";
    }
  };

  const getBackupTypeBadge = (type) => {
    switch (type) {
      case "backup":
        return "backup-type-auto";
      case "pre-restore":
        return "backup-type-restore";
      default:
        return "backup-type-unknown";
    }
  };

  const getEnvironmentColor = (env) => {
    switch (env) {
      case "dev":
        return "env-dev";
      case "qa":
        return "env-qa";
      case "staging":
        return "env-staging";
      case "prod":
        return "env-prod";
      default:
        return "";
    }
  };

  const filteredBackups = backups;

  if (loading) {
    return (
      <div className="admin-section">
        <h3>Terraform State Backups</h3>
        <div className="backups-loading">
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
        <h3>Terraform State Backups</h3>
        <div className="error-state">{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="backups-header">
        <h3>Terraform State Backups</h3>
        <div className="backups-controls">
          <select
            value={environmentFilter}
            onChange={(e) => setEnvironmentFilter(e.target.value)}
            className="env-filter"
          >
            <option value="all">All Environments</option>
            <option value="dev">Development</option>
            <option value="qa">QA</option>
            <option value="staging">Staging</option>
            <option value="prod">Production</option>
          </select>
          <button onClick={loadBackups} className="btn-refresh" title="Refresh">
            ↻
          </button>
        </div>
      </div>

      {filteredBackups.length === 0 ? (
        <div className="empty-state">
          No backups found{environmentFilter !== "all" ? ` for ${environmentFilter}` : ""}.
        </div>
      ) : (
        <div className="backups-table-container">
          <table className="backups-table">
            <thead>
              <tr>
                <th>Environment</th>
                <th>Type</th>
                <th>Timestamp</th>
                <th>Git SHA</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {filteredBackups.map((backup, index) => {
                const daysLeft = getDaysUntilExpiration(backup.createdAt);
                const expired = isExpired(backup.createdAt);

                return (
                  <tr key={index} className={expired ? "backup-expired" : ""}>
                    <td>
                      <span className={`env-badge ${getEnvironmentColor(backup.environment)}`}>
                        {backup.environment}
                      </span>
                    </td>
                    <td>
                      <span className={`backup-type-badge ${getBackupTypeBadge(backup.backupType)}`}>
                        {getBackupTypeLabel(backup.backupType)}
                      </span>
                    </td>
                    <td className="timestamp-cell">
                      {backup.timestamp ? formatTimestamp(backup.timestamp) : "N/A"}
                    </td>
                    <td className="git-sha-cell">
                      {backup.gitSha ? (
                        <code className="git-sha">{backup.gitSha}</code>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td className="created-cell">{formatDate(backup.createdAt)}</td>
                    <td className={`expires-cell ${expired ? "text-danger" : daysLeft <= 7 ? "text-warning" : ""}`}>
                      {expired ? (
                        <span>Expired</span>
                      ) : (
                        <span>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</span>
                      )}
                    </td>
                    <td className="size-cell">{backup.sizeMB} MB</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="backups-footer">
        <span className="backups-count">
          {filteredBackups.length} backup{filteredBackups.length !== 1 ? "s" : ""} (most recent)
        </span>
        <span className="text-muted">
          Backups are created automatically before each Terraform apply • Retained for 30 days
        </span>
      </div>
    </div>
  );
}

export default BackupsList;
