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
