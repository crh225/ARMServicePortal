import { useState } from "react";
import { OwnershipStatus } from "../../hooks/useResources";
import "../../styles/ResourceDetailDrawer.css";
import api from "../../services/api";

/**
 * Get Azure Portal URL for a resource
 */
function getAzurePortalUrl(resource) {
  return `https://portal.azure.com/#@/resource${resource.id}`;
}

/**
 * Status Badge Component
 */
function StatusBadge({ status }) {
  let className = "status-badge";
  let text = "";

  switch (status) {
    case OwnershipStatus.MANAGED:
      className += " status-badge--managed";
      text = "Managed";
      break;
    case OwnershipStatus.STALE:
      className += " status-badge--stale";
      text = "Stale";
      break;
    case OwnershipStatus.ORPHAN:
      className += " status-badge--orphan";
      text = "Orphan";
      break;
    case OwnershipStatus.UNMANAGED:
      className += " status-badge--unmanaged";
      text = "Unmanaged";
      break;
    case OwnershipStatus.PERMANENT:
      className += " status-badge--permanent";
      text = "Permanent";
      break;
    default:
      text = "Unknown";
  }

  return <span className={className}>{text}</span>;
}

/**
 * Health Badge Component
 */
function HealthBadge({ health }) {
  if (!health) return <span className="health-badge health-badge--unknown">Unknown</span>;

  const status = health.toLowerCase();

  if (status === "succeeded") {
    return <span className="health-badge health-badge--healthy">Healthy</span>;
  } else if (status === "failed") {
    return <span className="health-badge health-badge--unhealthy">Failed</span>;
  } else if (status === "running" || status === "updating" || status === "provisioning") {
    return <span className="health-badge health-badge--provisioning">Provisioning</span>;
  } else {
    return <span className="health-badge health-badge--unknown">{health}</span>;
  }
}

/**
 * Details Tab Content
 */
function ResourceDetailsTab({ resource }) {
  const [generatingTerraform, setGeneratingTerraform] = useState(false);
  const [terraformCode, setTerraformCode] = useState(null);
  const [terraformError, setTerraformError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateTerraform = async () => {
    setGeneratingTerraform(true);
    setTerraformError(null);
    setTerraformCode(null);

    try {
      const result = await api.generateTerraformCode(resource.id);
      setTerraformCode(result);
    } catch (error) {
      console.error("Failed to generate Terraform code:", error);
      setTerraformError(error.message);
    } finally {
      setGeneratingTerraform(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!terraformCode) return;

    try {
      await navigator.clipboard.writeText(terraformCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <div className="drawer-sections">
      {/* General Info - Two column grid */}
      <div className="drawer-section">
        <h3 className="section-title">General Information</h3>
        <div className="info-grid info-grid--two-cols">
          <div className="info-item">
            <span className="info-label">Name</span>
            <span className="info-value">{resource.name}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Location</span>
            <span className="info-value">{resource.location}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Type</span>
            <span className="info-value">{resource.type}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Resource Group</span>
            <span className="info-value">{resource.resourceGroup}</span>
          </div>
        </div>
      </div>

      {/* Azure IDs */}
      <div className="drawer-section">
        <h3 className="section-title">Azure Resource Identifiers</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Resource ID</span>
            <code className="info-code">{resource.id}</code>
          </div>
          <div className="info-item">
            <span className="info-label">Subscription ID</span>
            <code className="info-code">{resource.subscriptionId}</code>
          </div>
        </div>
      </div>

      {/* Portal Info - Three column grid */}
      <div className="drawer-section">
        <h3 className="section-title">ARM Portal Information</h3>
        <div className="info-grid info-grid--three-cols">
          <div className="info-item">
            <span className="info-label">Environment</span>
            <span className="info-value">{resource.environment || "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Blueprint</span>
            <span className="info-value">{resource.blueprintId || "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Owner</span>
            <span className="info-value">{resource.owner || "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Request ID</span>
            <span className="info-value">{resource.requestId || "—"}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Ownership Status</span>
            <span className="info-value">
              <StatusBadge status={resource.ownershipStatus} />
            </span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {Object.keys(resource.tags).length > 0 && (
        <div className="drawer-section">
          <h3 className="section-title">Tags</h3>
          <div className="tags-list">
            {Object.entries(resource.tags).map(([key, value]) => (
              <div key={key} className="tag-item">
                <span className="tag-key">{key}</span>
                <span className="tag-value">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Combined Cost, Health, and PR Row */}
      <div className="drawer-section">
        <h3 className="section-title">Status & Metrics</h3>
        <div className="info-grid info-grid--three-cols">
          <div className="info-item">
            <span className="info-label">Cost (30 Days)</span>
            <span className="info-value">
              {resource.cost !== null && resource.cost !== undefined
                ? `$${resource.cost.toFixed(2)}`
                : "—"}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Provisioning State</span>
            <span className="info-value">
              {resource.provisioningState ? (
                <HealthBadge health={resource.provisioningState} />
              ) : (
                "—"
              )}
            </span>
          </div>
          {resource.health && (
            <div className="info-item">
              <span className="info-label">Overall Health</span>
              <span className="info-value">
                <HealthBadge health={resource.health} />
              </span>
            </div>
          )}
          {resource.pr && (
            <>
              <div className="info-item">
                <span className="info-label">PR Number</span>
                <a
                  href={resource.pr.pullRequestUrl || `https://github.com/crh225/ARMServicePortal/pull/${resource.prNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="info-link"
                >
                  #{resource.prNumber}
                </a>
              </div>
              <div className="info-item">
                <span className="info-label">PR Status</span>
                <span className="info-value">
                  {resource.pr.merged ? "Merged" : resource.pr.status}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">PR Title</span>
                <span className="info-value">{resource.pr.title}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="drawer-section">
        <h3 className="section-title">Actions</h3>
        <div className="action-buttons">
          <a
            href={getAzurePortalUrl(resource)}
            target="_blank"
            rel="noreferrer"
            className="action-btn action-btn--primary"
          >
            Open in Azure Portal
          </a>
          {resource.pr && (
            <a
              href={resource.pr.pullRequestUrl || `https://github.com/crh225/ARMServicePortal/pull/${resource.prNumber}`}
              target="_blank"
              rel="noreferrer"
              className="action-btn action-btn--secondary"
            >
              Open PR in GitHub
            </a>
          )}
          {resource.ownershipStatus === "unmanaged" && (
            <button
              className="action-btn action-btn--secondary"
              onClick={handleGenerateTerraform}
              disabled={generatingTerraform}
            >
              {generatingTerraform ? "Generating..." : "Generate Terraform Code"}
            </button>
          )}
        </div>
      </div>

      {/* Terraform Code Generation */}
      {terraformCode && (
        <div className="drawer-section">
          <h3 className="section-title">Generated Terraform Code</h3>
          <div style={{ marginBottom: "12px" }}>
            <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "8px" }}>
              Review and customize the generated code before applying:
            </p>
            <ul style={{ fontSize: "0.875rem", color: "#6b7280", paddingLeft: "20px", marginBottom: "12px" }}>
              {terraformCode.notes?.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
            <button
              className="action-btn action-btn--secondary"
              onClick={handleCopyToClipboard}
              style={{ marginBottom: "8px" }}
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
          <pre style={{
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
            padding: "16px",
            borderRadius: "4px",
            overflow: "auto",
            fontSize: "0.875rem",
            fontFamily: "monospace",
            maxHeight: "400px"
          }}>
            {terraformCode.code}
          </pre>
        </div>
      )}

      {terraformError && (
        <div className="drawer-section">
          <div style={{
            padding: "12px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "4px",
            color: "#991b1b"
          }}>
            <strong>Error:</strong> {terraformError}
          </div>
        </div>
      )}
    </div>
  );
}

export default ResourceDetailsTab;
