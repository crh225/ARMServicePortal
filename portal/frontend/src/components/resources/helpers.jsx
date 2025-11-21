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
