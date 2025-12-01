import React from "react";
import { OwnershipStatus } from "../../hooks/useResources";

/**
 * Get display-friendly resource type
 */
export function getResourceTypeDisplay(type) {
  if (!type) return "Unknown";
  const parts = type.split("/");
  return parts[parts.length - 1];
}

/**
 * Get resource type icon SVG
 */
export function getResourceTypeIcon(type) {
  if (!type) {
    // Default icon
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M8 0L0 4v8l8 4 8-4V4L8 0zm0 2.5L13 5 8 7.5 3 5l5-2.5zM2 6.5L7 9v6.5L2 13V6.5zm12 0v6.5l-5 2.5V9l5-2.5z"/>
      </svg>
    );
  }

  const typeLower = type.toLowerCase();

  // Virtual Machine
  if (typeLower.includes("virtualmachine")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v1h14V2a1 1 0 0 0-1-1H2zM1 5v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5H1zm2 2h2v2H3V7zm3 0h2v2H6V7zm3 0h2v2H9V7z"/>
      </svg>
    );
  }

  // Storage Accounts
  if (typeLower.includes("storageaccount")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v3h14V2a1 1 0 0 0-1-1H2zM1 6v2h14V6H1zm0 3v2h14V9H1zm0 3v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2H1z"/>
      </svg>
    );
  }

  // Container Apps, Container Groups
  if (typeLower.includes("container")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2z"/>
        <path d="M3 4h10v1H3V4zm0 3h10v1H3V7zm0 3h10v1H3v-1z"/>
      </svg>
    );
  }

  // Registries
  if (typeLower.includes("registr")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H4z"/>
        <path d="M5 4h6v1H5V4zm0 2h6v1H5V6zm0 2h6v1H5V8zm0 2h6v1H5v-1z"/>
      </svg>
    );
  }

  // Databases (PostgreSQL, MySQL, SQL, etc.)
  if (typeLower.includes("database") || typeLower.includes("postgre") || typeLower.includes("mysql") || typeLower.includes("sql")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M8 1c2.5 0 4.5 0.7 4.5 1.5v11c0 0.8-2 1.5-4.5 1.5S3.5 14.3 3.5 13.5v-11C3.5 1.7 5.5 1 8 1z"/>
        <ellipse cx="8" cy="2.5" rx="4.5" ry="1.5"/>
        <ellipse cx="8" cy="6" rx="4.5" ry="1.5" opacity="0.6"/>
        <ellipse cx="8" cy="9.5" rx="4.5" ry="1.5" opacity="0.4"/>
      </svg>
    );
  }

  // CDN / Front Door
  if (typeLower.includes("cdn") || typeLower.includes("frontdoor")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM1 8a7 7 0 0 1 13.97-.748L10.28 8.5a3 3 0 0 0-2.03-2.78l1.38-2.4A7.03 7.03 0 0 1 14.97 8H11.5a3 3 0 0 0-2.78-2.03l-1.38 2.4a3 3 0 1 0 3.14 3.14l2.4 1.38A7.03 7.03 0 0 1 8 14.97V11.5a3 3 0 0 0 2.03-2.78l2.4-1.38A7.03 7.03 0 0 1 15 8H1z"/>
        <circle cx="8" cy="8" r="2"/>
      </svg>
    );
  }

  // Elasticsearch / ELK Stack
  if (typeLower.includes("elk") || typeLower.includes("elastic") || typeLower.includes("kibana") || typeLower.includes("logstash")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M2 1h12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z"/>
        <path d="M2 6h12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" opacity="0.7"/>
        <path d="M2 11h12a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1z" opacity="0.5"/>
        <circle cx="13" cy="3" r="1.5" fill="#00BFB3"/>
        <circle cx="13" cy="8" r="1.5" fill="#FEC514"/>
        <circle cx="13" cy="13" r="1.5" fill="#EF5098"/>
      </svg>
    );
  }

  // Key Vault
  if (typeLower.includes("keyvault") || typeLower.includes("vault")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M8 1a3 3 0 0 0-3 3v2H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1V4a3 3 0 0 0-3-3zm-2 3a2 2 0 1 1 4 0v2H6V4zm2 6a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1z"/>
      </svg>
    );
  }

  // Virtual Network / Networking
  if (typeLower.includes("virtualnetwork") || typeLower.includes("networkinterface") || typeLower.includes("networksecurity")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <circle cx="3" cy="3" r="2"/>
        <circle cx="13" cy="3" r="2"/>
        <circle cx="3" cy="13" r="2"/>
        <circle cx="13" cy="13" r="2"/>
        <circle cx="8" cy="8" r="2"/>
        <path d="M5 3h6M5 13h6M3 5v6M13 5v6M5 5l2 2M9 9l2 2M9 5l2-2M5 11l2-2" strokeWidth="1" stroke="currentColor" fill="none"/>
      </svg>
    );
  }

  // Public IP
  if (typeLower.includes("publicip")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 1v14M1 8h14M2 4h12M2 12h12" stroke="currentColor" strokeWidth="1" fill="none"/>
      </svg>
    );
  }

  // Load Balancer
  if (typeLower.includes("loadbalancer")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <rect x="1" y="6" width="14" height="4" rx="1"/>
        <path d="M4 3h2v3H4zM10 3h2v3h-2zM4 10v3h2v-3M10 10v3h2v-3"/>
      </svg>
    );
  }

  // Application Gateway
  if (typeLower.includes("applicationgateway")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <rect x="5" y="1" width="6" height="4" rx="1"/>
        <rect x="1" y="11" width="4" height="4" rx="1"/>
        <rect x="6" y="11" width="4" height="4" rx="1"/>
        <rect x="11" y="11" width="4" height="4" rx="1"/>
        <path d="M8 5v3M3 8v3M8 8v3M13 8v3M3 8h10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    );
  }

  // Web Apps / App Service / Static Sites
  if (typeLower.includes("web/site") || typeLower.includes("staticsite") || typeLower.includes("serverfarm")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <rect x="1" y="2" width="14" height="12" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1 5h14" stroke="currentColor" strokeWidth="1"/>
        <circle cx="3" cy="3.5" r="0.75"/>
        <circle cx="5" cy="3.5" r="0.75"/>
        <circle cx="7" cy="3.5" r="0.75"/>
        <path d="M4 8l2 2-2 2M8 8h4" stroke="currentColor" strokeWidth="1" fill="none"/>
      </svg>
    );
  }

  // Application Insights / Monitoring
  if (typeLower.includes("insights") || typeLower.includes("monitor")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M2 13l3-4 3 2 4-6 2 3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="2" cy="13" r="1.5"/>
        <circle cx="5" cy="9" r="1.5"/>
        <circle cx="8" cy="11" r="1.5"/>
        <circle cx="12" cy="5" r="1.5"/>
        <circle cx="14" cy="8" r="1.5"/>
      </svg>
    );
  }

  // Log Analytics
  if (typeLower.includes("operationalinsights") || typeLower.includes("loganalytics")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 11V7M6 11V5M9 11V8M12 11V4" stroke="currentColor" strokeWidth="2"/>
      </svg>
    );
  }

  // Managed Identity
  if (typeLower.includes("managedidentity") || typeLower.includes("userassignedidentit")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <circle cx="8" cy="5" r="3"/>
        <path d="M3 14c0-3 2-5 5-5s5 2 5 5"/>
        <path d="M11 3l2 2-2 2" stroke="currentColor" strokeWidth="1" fill="none"/>
      </svg>
    );
  }

  // Cosmos DB
  if (typeLower.includes("documentdb") || typeLower.includes("cosmosdb") || typeLower.includes("cosmos")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <ellipse cx="8" cy="8" rx="7" ry="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <ellipse cx="8" cy="8" rx="3" ry="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="2"/>
      </svg>
    );
  }

  // Disks / Snapshots
  if (typeLower.includes("disk") || typeLower.includes("snapshot")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1"/>
        <circle cx="8" cy="8" r="1.5"/>
      </svg>
    );
  }

  // VM Scale Sets
  if (typeLower.includes("virtualmachinescaleset")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <rect x="1" y="1" width="5" height="4" rx="0.5"/>
        <rect x="1" y="6" width="5" height="4" rx="0.5"/>
        <rect x="1" y="11" width="5" height="4" rx="0.5"/>
        <rect x="7" y="1" width="5" height="4" rx="0.5"/>
        <rect x="7" y="6" width="5" height="4" rx="0.5"/>
        <rect x="7" y="11" width="5" height="4" rx="0.5"/>
        <path d="M13 3h2M13 8h2M13 13h2" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    );
  }

  // Resource Group
  if (typeLower.includes("resourcegroup")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <rect x="1" y="3" width="14" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1 6h5l1-1.5h4l1 1.5h4" stroke="currentColor" strokeWidth="1" fill="none"/>
      </svg>
    );
  }

  // Container App Environment
  if (typeLower.includes("managedenvironment")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="3" y="3" width="4" height="4" rx="0.5"/>
        <rect x="9" y="3" width="4" height="4" rx="0.5"/>
        <rect x="3" y="9" width="4" height="4" rx="0.5"/>
        <rect x="9" y="9" width="4" height="4" rx="0.5"/>
      </svg>
    );
  }

  // Redis Cache
  if (typeLower.includes("redis") || typeLower.includes("cache/redis")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M15 8.5c0 1.1-3.1 2-7 2s-7-.9-7-2V11c0 1.1 3.1 2 7 2s7-.9 7-2V8.5z"/>
        <path d="M15 5c0 1.1-3.1 2-7 2S1 6.1 1 5v2.5c0 1.1 3.1 2 7 2s7-.9 7-2V5z" opacity="0.7"/>
        <ellipse cx="8" cy="5" rx="7" ry="2"/>
      </svg>
    );
  }

  // Service Bus
  if (typeLower.includes("servicebus")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <rect x="1" y="4" width="4" height="8" rx="1"/>
        <rect x="11" y="4" width="4" height="8" rx="1"/>
        <path d="M5 6h6M5 8h6M5 10h6" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    );
  }

  // Event Hub
  if (typeLower.includes("eventhub")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M8 2v12M4 4l4 4-4 4M12 4l-4 4 4 4" stroke="currentColor" strokeWidth="1" fill="none"/>
      </svg>
    );
  }

  // Function App
  if (typeLower.includes("function")) {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
        <path d="M5 2L3 8l2 6M11 2l2 6-2 6M7 14L9 2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      </svg>
    );
  }

  // Default icon
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="resource-type-icon">
      <path d="M8 0L0 4v8l8 4 8-4V4L8 0zm0 2.5L13 5 8 7.5 3 5l5-2.5zM2 6.5L7 9v6.5L2 13V6.5zm12 0v6.5l-5 2.5V9l5-2.5z"/>
    </svg>
  );
}

/**
 * Get status badge class
 */
export function getStatusBadgeClass(status) {
  switch (status) {
    case OwnershipStatus.MANAGED:
      return "status-badge status-badge--managed";
    case OwnershipStatus.PERMANENT:
      return "status-badge status-badge--permanent";
    case OwnershipStatus.STALE:
      return "status-badge status-badge--stale";
    case OwnershipStatus.ORPHAN:
      return "status-badge status-badge--orphan";
    case OwnershipStatus.UNMANAGED:
      return "status-badge status-badge--unmanaged";
    default:
      return "status-badge";
  }
}

/**
 * Get status display text
 */
export function getStatusDisplay(status) {
  switch (status) {
    case OwnershipStatus.MANAGED:
      return "Managed";
    case OwnershipStatus.PERMANENT:
      return "Permanent";
    case OwnershipStatus.STALE:
      return "Stale";
    case OwnershipStatus.ORPHAN:
      return "Orphan";
    case OwnershipStatus.UNMANAGED:
      return "Unmanaged";
    default:
      return "Unknown";
  }
}

/**
 * Get health status display with badge
 */
export function getHealthDisplay(health) {
  if (!health) return "—";

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
