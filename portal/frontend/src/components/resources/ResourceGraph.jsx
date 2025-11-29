import { useEffect, useState, useCallback, useRef } from "react";
import ReactFlow, {
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";
import { fetchAllResources } from "../../services/resourcesApi";
import api from "../../services/api";
import "../../styles/ResourceGraph.css";

/**
 * Health status indicator component
 */
function HealthIndicator({ health }) {
  if (!health) return null;

  const statusColors = {
    healthy: "#10b981",
    warning: "#f59e0b",
    critical: "#ef4444",
    unknown: "#94a3b8",
  };

  const statusLabels = {
    healthy: "Healthy",
    warning: "Warning",
    critical: "Critical",
    unknown: "Unknown",
  };

  const color = statusColors[health] || statusColors.unknown;
  const label = statusLabels[health] || "Unknown";

  return (
    <div className="health-indicator" title={label}>
      <span className="health-dot" style={{ backgroundColor: color }} />
    </div>
  );
}

/**
 * Enhanced custom node component with more info
 * Leaf nodes (resources) can be expanded in focused view to show detailed information
 */
function ResourceNode({ data }) {
  const isLeafNode = data.nodeType === "resource";
  const isExpanded = data.isExpanded;

  // Expanded view for focused resource (shown in focused view only)
  if (isLeafNode && isExpanded) {
    return (
      <div
        className={`resource-node ${data.nodeType} expanded ${data.isCurrent ? "current" : ""}`}
        title={data.fullName || data.label}
      >
        {/* Handle for incoming edge from parent */}
        <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
        {data.health && <HealthIndicator health={data.health} />}

        <div className="expanded-node-header">
          <div className="resource-node-icon">{data.icon}</div>
          <div className="expanded-node-title">
            <div className="resource-node-name">{data.fullName || data.label}</div>
            {data.resourceType && (
              <div className="resource-node-type">{data.resourceType}</div>
            )}
          </div>
          <div className="expanded-close-hint">Click to go back</div>
        </div>

        <div className="expanded-node-body">
          <div className="expanded-section">
            <div className="expanded-section-title">Details</div>
            <div className="expanded-detail-row">
              <span className="expanded-label">Location:</span>
              <span className="expanded-value">{data.location || "N/A"}</span>
            </div>
            <div className="expanded-detail-row">
              <span className="expanded-label">Type:</span>
              <span className="expanded-value">{data.fullType || data.resourceType || "N/A"}</span>
            </div>
            {data.sku && (
              <div className="expanded-detail-row">
                <span className="expanded-label">SKU:</span>
                <span className="expanded-value">{data.sku}</span>
              </div>
            )}
            {data.kind && (
              <div className="expanded-detail-row">
                <span className="expanded-label">Kind:</span>
                <span className="expanded-value">{data.kind}</span>
              </div>
            )}
          </div>

          {data.cost > 0 && (
            <div className="expanded-section">
              <div className="expanded-section-title">Cost</div>
              <div className="expanded-cost-display">
                <span className="expanded-cost-amount">${data.cost.toFixed(2)}</span>
                <span className="expanded-cost-period">/month</span>
              </div>
            </div>
          )}

          {data.tags && Object.keys(data.tags).length > 0 && (
            <div className="expanded-section">
              <div className="expanded-section-title">Tags ({Object.keys(data.tags).length})</div>
              <div className="expanded-tags-list">
                {Object.entries(data.tags).slice(0, 5).map(([key, value]) => (
                  <div key={key} className="expanded-tag">
                    <span className="expanded-tag-key">{key}:</span>
                    <span className="expanded-tag-value">{value}</span>
                  </div>
                ))}
                {Object.keys(data.tags).length > 5 && (
                  <div className="expanded-tag-more">+{Object.keys(data.tags).length - 5} more</div>
                )}
              </div>
            </div>
          )}

          {data.dependencies && data.dependencies.length > 0 && (
            <div className="expanded-section">
              <div className="expanded-section-title">Dependencies ({data.dependencies.length})</div>
              <div className="expanded-deps-list">
                {data.dependencies.map((dep, idx) => (
                  <div key={idx} className="expanded-dep-item">
                    <span className="expanded-dep-type">{dep.type}</span>
                    <span className="expanded-dep-name">{dep.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.provisioningState && (
            <div className="expanded-section">
              <div className="expanded-section-title">Status</div>
              <div className={`expanded-status ${data.provisioningState.toLowerCase()}`}>
                {data.provisioningState}
              </div>
            </div>
          )}

          {data.resourceId && (
            <div className="expanded-section">
              <a
                href={`https://portal.azure.com/#@/resource${data.resourceId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="expanded-portal-link"
                onClick={(e) => e.stopPropagation()}
              >
                View in Azure Portal
              </a>
            </div>
          )}
        </div>

        {data.isCurrent && <div className="resource-node-badge">Current</div>}
      </div>
    );
  }

  // Normal compact view
  return (
    <div
      className={`resource-node ${data.nodeType} ${data.isCurrent ? "current" : ""} ${data.clickable || isLeafNode ? "clickable" : ""}`}
      title={data.fullName || data.label}
    >
      {/* Handles for edge connections - all nodes get both handles */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

      {data.health && <HealthIndicator health={data.health} />}

      <div className="resource-node-icon">{data.icon}</div>

      <div className="resource-node-content">
        <div className="resource-node-name">
          {data.label}
        </div>

        {data.resourceType && (
          <div className="resource-node-type">{data.resourceType}</div>
        )}

        {data.location && (
          <div className="resource-node-location"><span className="inline-icon">{Icons.location}</span> {data.location}</div>
        )}

        {data.count !== undefined && (
          <div className="resource-node-count">{data.count} resources</div>
        )}

        <div className="resource-node-meta">
          {data.cost > 0 && (
            <span className="resource-node-cost">${data.cost.toFixed(2)}/mo</span>
          )}
          {data.tags && Object.keys(data.tags).length > 0 && (
            <span className="resource-node-tags"><span className="inline-icon">{Icons.tag}</span> {Object.keys(data.tags).length}</span>
          )}
        </div>
      </div>

      {data.isCurrent && <div className="resource-node-badge">Current</div>}
      {(data.clickable || isLeafNode) && (
        <div className="resource-node-expand">{isLeafNode ? Icons.expand : Icons.arrow}</div>
      )}

      {data.dependencies && data.dependencies.length > 0 && (
        <div className="resource-node-deps" title={`${data.dependencies.length} dependencies`}>
          <span className="inline-icon">{Icons.link}</span> {data.dependencies.length}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  resourceNode: ResourceNode,
};

/**
 * SVG Icon components - Official Azure icons in white
 * Based on Azure Architecture Icons
 */
const Icons = {
  // Azure Subscription icon
  subscription: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M.5 5.793h4.527V1.025H.5v4.768zm0 5.866h4.527V6.891H.5v4.768zm5.645-5.866h4.527V1.025H6.145v4.768zm5.644 0h4.527V1.025h-4.527v4.768zm-5.644 5.866h4.527V6.891H6.145v4.768zm5.644 0h4.527V6.891h-4.527v4.768zM.5 16.975h4.527v-4.217H.5v4.217zm5.645 0h4.527v-4.217H6.145v4.217zm5.644 0h4.527v-4.217h-4.527v4.217z"/>
    </svg>
  ),
  // Azure Resource Group icon
  resourceGroup: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M16.5 5.5h-6l-1.5-2h-7.5a1 1 0 00-1 1v9a1 1 0 001 1h15a1 1 0 001-1v-7a1 1 0 00-1-1zm-15-1h6.793l1.5 2H16.5v7h-15v-9z"/>
      <rect x="3" y="8" width="4" height="4" rx=".5"/>
      <rect x="8" y="8" width="4" height="4" rx=".5"/>
    </svg>
  ),
  // Azure Storage Account icon
  storage: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M.5 5.077h5.27v3.846H.5V5.077zm0 4.5h5.27v3.846H.5V9.577zm5.962-4.5h5.269v3.846H6.462V5.077zm0 4.5h5.269v3.846H6.462V9.577zm5.961-4.5h5.27v3.846h-5.27V5.077zm0 4.5h5.27v3.846h-5.27V9.577z"/>
    </svg>
  ),
  // Azure Virtual Network icon
  virtualNetwork: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M9 1L1 5v8l8 4 8-4V5L9 1zm6.5 11.5L9 15.7l-6.5-3.2V5.5L9 2.3l6.5 3.2v7z"/>
      <circle cx="9" cy="9" r="2"/>
      <circle cx="4" cy="6" r="1.5"/>
      <circle cx="14" cy="6" r="1.5"/>
      <circle cx="4" cy="12" r="1.5"/>
      <circle cx="14" cy="12" r="1.5"/>
      <line x1="9" y1="7" x2="9" y2="4" stroke="currentColor" strokeWidth=".5"/>
      <line x1="7.3" y1="8" x2="5.2" y2="6.8" stroke="currentColor" strokeWidth=".5"/>
      <line x1="10.7" y1="8" x2="12.8" y2="6.8" stroke="currentColor" strokeWidth=".5"/>
      <line x1="7.3" y1="10" x2="5.2" y2="11.2" stroke="currentColor" strokeWidth=".5"/>
      <line x1="10.7" y1="10" x2="12.8" y2="11.2" stroke="currentColor" strokeWidth=".5"/>
    </svg>
  ),
  // Azure Virtual Machine icon
  virtualMachine: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <rect x="1" y="2" width="16" height="11" rx="1"/>
      <rect x="2.5" y="3.5" width="13" height="8" rx=".5" fill="none" stroke="currentColor" strokeWidth=".5"/>
      <path d="M6 15h6M9 13v2"/>
      <rect x="5" y="15" width="8" height="1.5" rx=".5"/>
    </svg>
  ),
  // Azure Kubernetes Service icon
  kubernetes: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M9 1.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zM9 3l.9 2.8h2.9l-2.4 1.7.9 2.8L9 8.6l-2.3 1.7.9-2.8-2.4-1.7h2.9L9 3z"/>
      <circle cx="9" cy="9" r="1.5"/>
      <path d="M9 5v2.5M9 10.5V13M6 7.5l2 1.5M10 9l2 1.5M6 10.5l2-1.5M10 9l2-1.5"/>
    </svg>
  ),
  // Azure Public IP icon
  publicIp: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 2v14M2 9h14" stroke="currentColor" strokeWidth="1"/>
      <ellipse cx="9" cy="9" rx="3" ry="7" fill="none" stroke="currentColor" strokeWidth="1"/>
    </svg>
  ),
  // Azure Load Balancer icon
  loadBalancer: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <circle cx="9" cy="3" r="2"/>
      <circle cx="4" cy="15" r="2"/>
      <circle cx="9" cy="15" r="2"/>
      <circle cx="14" cy="15" r="2"/>
      <path d="M9 5v3M9 10v3M4 13V9l5-1M14 13V9l-5-1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  // Azure Network Security Group icon
  nsg: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M9 1L2 4v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V4L9 1zm0 2l5 2v4c0 3.5-2.2 6.5-5 7.8-2.8-1.3-5-4.3-5-7.8V5l5-2z"/>
      <path d="M7 8h4v1H7zM7 10h4v1H7zM7 12h4v1H7z"/>
    </svg>
  ),
  // Azure Managed Disk icon
  disk: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <ellipse cx="9" cy="9" rx="8" ry="4"/>
      <ellipse cx="9" cy="9" rx="5" ry="2.5" fill="none" stroke="currentColor" strokeWidth=".75"/>
      <ellipse cx="9" cy="9" rx="2" ry="1"/>
    </svg>
  ),
  // Azure Managed Identity icon
  identity: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <circle cx="9" cy="5" r="3.5"/>
      <path d="M2 16c0-4 3-6 7-6s7 2 7 6"/>
      <circle cx="13" cy="13" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13 11.5v3M11.5 13h3" stroke="currentColor" strokeWidth="1"/>
    </svg>
  ),
  // Azure CDN / Front Door icon
  cdn: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 9h14M9 2c-2 2-3 4.5-3 7s1 5 3 7M9 2c2 2 3 4.5 3 7s-1 5-3 7"/>
      <circle cx="9" cy="9" r="2"/>
    </svg>
  ),
  // Azure SQL Database icon
  database: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <ellipse cx="9" cy="4" rx="7" ry="2.5"/>
      <path d="M2 4v10c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V4"/>
      <ellipse cx="9" cy="9" rx="7" ry="2.5" fill="none" stroke="currentColor" strokeWidth=".5"/>
      <ellipse cx="9" cy="14" rx="7" ry="2.5" fill="none" stroke="currentColor" strokeWidth=".5"/>
    </svg>
  ),
  // Azure Key Vault icon
  keyVault: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <rect x="3" y="7" width="12" height="9" rx="1"/>
      <path d="M6 7V5a3 3 0 016 0v2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="9" cy="11" r="1.5"/>
      <path d="M9 12.5v2"/>
    </svg>
  ),
  // Azure App Service / Web App icon
  webApp: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <rect x="1" y="2" width="16" height="14" rx="1"/>
      <rect x="2" y="5" width="14" height="10" rx=".5" fill="none" stroke="currentColor" strokeWidth=".5"/>
      <circle cx="3" cy="3.5" r=".75"/>
      <circle cx="5" cy="3.5" r=".75"/>
      <circle cx="7" cy="3.5" r=".75"/>
    </svg>
  ),
  // Azure Container Registry icon
  containerRegistry: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M1 6l8-4 8 4v6l-8 4-8-4V6z"/>
      <path d="M1 6l8 4 8-4M9 10v8" fill="none" stroke="currentColor" strokeWidth=".5"/>
      <rect x="6" y="7" width="6" height="4" rx=".5" fill="none" stroke="currentColor" strokeWidth=".75"/>
    </svg>
  ),
  // Azure Network Interface icon
  nic: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <rect x="2" y="4" width="14" height="10" rx="1"/>
      <rect x="4" y="6" width="4" height="3" rx=".5"/>
      <rect x="4" y="10" width="4" height="2" rx=".5"/>
      <circle cx="12" cy="7.5" r="1"/>
      <circle cx="12" cy="11" r="1"/>
      <path d="M14 7.5h2M14 11h2"/>
    </svg>
  ),
  // Azure App Service Plan icon
  appService: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <rect x="1" y="1" width="7" height="7" rx="1"/>
      <rect x="10" y="1" width="7" height="7" rx="1"/>
      <rect x="1" y="10" width="7" height="7" rx="1"/>
      <rect x="10" y="10" width="7" height="7" rx="1"/>
      <path d="M4.5 3v3M3 4.5h3M13.5 3v3M12 4.5h3M4.5 12v3M3 13.5h3"/>
    </svg>
  ),
  // Azure Functions icon
  functions: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M10 1L4 9h4l-2 8 8-10h-5l3-6h-2z"/>
    </svg>
  ),
  // Azure Cosmos DB icon
  cosmosDb: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <ellipse cx="9" cy="9" rx="8" ry="3"/>
      <ellipse cx="9" cy="9" rx="8" ry="3" transform="rotate(60 9 9)" fill="none" stroke="currentColor" strokeWidth=".75"/>
      <ellipse cx="9" cy="9" rx="8" ry="3" transform="rotate(120 9 9)" fill="none" stroke="currentColor" strokeWidth=".75"/>
      <circle cx="9" cy="9" r="2"/>
    </svg>
  ),
  // Azure Application Gateway icon
  appGateway: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <rect x="6" y="2" width="6" height="4" rx=".5"/>
      <rect x="1" y="12" width="4" height="4" rx=".5"/>
      <rect x="7" y="12" width="4" height="4" rx=".5"/>
      <rect x="13" y="12" width="4" height="4" rx=".5"/>
      <path d="M9 6v2M3 12V9h12v3M9 9v3" fill="none" stroke="currentColor" strokeWidth="1"/>
    </svg>
  ),
  // Default Azure resource icon
  default: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M9 1L1 5v8l8 4 8-4V5L9 1zm0 2l6 3v6l-6 3-6-3V6l6-3z"/>
      <circle cx="9" cy="9" r="2"/>
    </svg>
  ),
  // Generic document icon
  document: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M10 1H4a1 1 0 00-1 1v14a1 1 0 001 1h10a1 1 0 001-1V6l-5-5z"/>
      <path d="M10 1v5h5" fill="none" stroke="currentColor" strokeWidth=".5"/>
      <path d="M5 9h8M5 11h8M5 13h5"/>
    </svg>
  ),
  // Back arrow icon
  back: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M15 9H3M8 4L3 9l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  // Location/map pin icon
  location: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M9 1C5.7 1 3 3.7 3 7c0 4.5 6 10 6 10s6-5.5 6-10c0-3.3-2.7-6-6-6zm0 8a2 2 0 110-4 2 2 0 010 4z"/>
    </svg>
  ),
  // Tag icon
  tag: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M16 9.4L9.4 16a1 1 0 01-1.4 0L2 10V2h8l6 6a1 1 0 010 1.4zM5.5 5.5a1 1 0 100 2 1 1 0 000-2z"/>
    </svg>
  ),
  // Link/dependency icon
  link: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M7.5 10.5a3.5 3.5 0 005 0l2-2a3.5 3.5 0 00-5-5l-1 1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10.5 7.5a3.5 3.5 0 00-5 0l-2 2a3.5 3.5 0 005 5l1-1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  // Plus icon
  plus: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  // Expand icon
  expand: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <circle cx="9" cy="9" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9 5v8M5 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  // Arrow icon
  arrow: (
    <svg viewBox="0 0 18 18" fill="currentColor">
      <path d="M3 9h12M11 5l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

/**
 * Get icon for resource type
 */
function getTypeIcon(type, resourceType) {
  if (type === "subscription") return Icons.subscription;
  if (type === "resourceGroup") return Icons.resourceGroup;
  if (type === "subResource") return Icons.document;
  if (type === "back") return Icons.back;
  if (type === "more") return Icons.plus;

  const rt = (resourceType || "").toLowerCase();

  // Storage
  if (rt.includes("storageaccount") || rt.includes("storage/")) return Icons.storage;

  // Networking
  if (rt.includes("virtualnetwork") || rt.includes("vnet")) return Icons.virtualNetwork;
  if (rt.includes("publicip")) return Icons.publicIp;
  if (rt.includes("loadbalancer")) return Icons.loadBalancer;
  if (rt.includes("networksecuritygroup") || rt.includes("nsg")) return Icons.nsg;
  if (rt.includes("networkinterface") || rt.includes("/nic")) return Icons.nic;
  if (rt.includes("applicationgateway")) return Icons.appGateway;
  if (rt.includes("frontdoor") || rt.includes("cdn")) return Icons.cdn;

  // Compute
  if (rt.includes("virtualmachine") || rt.includes("vmss") || rt.includes("vm/")) return Icons.virtualMachine;
  if (rt.includes("managedcluster") || rt.includes("kubernetes") || rt.includes("aks")) return Icons.kubernetes;
  if (rt.includes("disk")) return Icons.disk;

  // Web & Functions
  if (rt.includes("sites") && rt.includes("function")) return Icons.functions;
  if (rt.includes("sites") || rt.includes("webapp")) return Icons.webApp;
  if (rt.includes("serverfarm") || rt.includes("appserviceplan")) return Icons.appService;

  // Databases
  if (rt.includes("cosmosdb") || rt.includes("documentdb")) return Icons.cosmosDb;
  if (rt.includes("sql") || rt.includes("database") || rt.includes("mysql") || rt.includes("postgresql")) return Icons.database;

  // Security & Identity
  if (rt.includes("keyvault") || rt.includes("vault")) return Icons.keyVault;
  if (rt.includes("identity") || rt.includes("managedidentit")) return Icons.identity;

  // Containers
  if (rt.includes("containerregistry") || rt.includes("acr")) return Icons.containerRegistry;
  if (rt.includes("containerinstance") || rt.includes("containergroup")) return Icons.containerRegistry;

  return Icons.default;
}

/**
 * Detect resource dependencies based on Azure resource relationships
 */
function detectDependencies(resource, allResources) {
  const dependencies = [];
  const resourceType = (resource.type || "").toLowerCase();
  const resourceId = (resource.id || "").toLowerCase();

  // VM dependencies
  if (resourceType.includes("virtualmachine")) {
    // Find associated disks
    allResources.forEach(r => {
      const rType = (r.type || "").toLowerCase();
      if (rType.includes("disk") && r.resourceGroup?.toLowerCase() === resource.resourceGroup?.toLowerCase()) {
        dependencies.push({ id: r.id, type: "disk", name: r.name });
      }
      // Find NICs
      if (rType.includes("networkinterface") && r.resourceGroup?.toLowerCase() === resource.resourceGroup?.toLowerCase()) {
        dependencies.push({ id: r.id, type: "nic", name: r.name });
      }
    });
  }

  // NIC dependencies
  if (resourceType.includes("networkinterface")) {
    allResources.forEach(r => {
      const rType = (r.type || "").toLowerCase();
      // Find VNets
      if (rType.includes("virtualnetwork") && r.resourceGroup?.toLowerCase() === resource.resourceGroup?.toLowerCase()) {
        dependencies.push({ id: r.id, type: "vnet", name: r.name });
      }
      // Find NSGs
      if (rType.includes("networksecuritygroup") && r.resourceGroup?.toLowerCase() === resource.resourceGroup?.toLowerCase()) {
        dependencies.push({ id: r.id, type: "nsg", name: r.name });
      }
      // Find Public IPs
      if (rType.includes("publicip") && r.resourceGroup?.toLowerCase() === resource.resourceGroup?.toLowerCase()) {
        dependencies.push({ id: r.id, type: "publicip", name: r.name });
      }
    });
  }

  // AKS dependencies
  if (resourceType.includes("managedcluster")) {
    allResources.forEach(r => {
      const rType = (r.type || "").toLowerCase();
      if (rType.includes("virtualnetwork") && r.resourceGroup?.toLowerCase() === resource.resourceGroup?.toLowerCase()) {
        dependencies.push({ id: r.id, type: "vnet", name: r.name });
      }
      if (rType.includes("containerregistry")) {
        dependencies.push({ id: r.id, type: "acr", name: r.name });
      }
      if (rType.includes("identity") && r.resourceGroup?.toLowerCase() === resource.resourceGroup?.toLowerCase()) {
        dependencies.push({ id: r.id, type: "identity", name: r.name });
      }
    });
  }

  // Web App dependencies
  if (resourceType.includes("sites") || resourceType.includes("webapp")) {
    allResources.forEach(r => {
      const rType = (r.type || "").toLowerCase();
      if (rType.includes("serverfarm") && r.resourceGroup?.toLowerCase() === resource.resourceGroup?.toLowerCase()) {
        dependencies.push({ id: r.id, type: "appserviceplan", name: r.name });
      }
      if (rType.includes("database") || rType.includes("sql")) {
        dependencies.push({ id: r.id, type: "database", name: r.name });
      }
    });
  }

  return dependencies;
}

/**
 * Simulate health status based on resource properties
 */
function getResourceHealth(resource) {
  // In a real app, this would come from Azure Resource Health API
  // For now, simulate based on resource properties
  if (resource.provisioningState === "Failed") return "critical";
  if (resource.provisioningState === "Updating") return "warning";
  if (resource.status === "Stopped" || resource.status === "Deallocated") return "warning";

  // Random health for demo purposes (remove in production)
  const rand = Math.random();
  if (rand > 0.9) return "warning";
  if (rand > 0.95) return "critical";
  return "healthy";
}

/**
 * Format location name
 */
function formatLocation(location) {
  if (!location) return null;
  const locationMap = {
    "eastus": "East US",
    "eastus2": "East US 2",
    "westus": "West US",
    "westus2": "West US 2",
    "centralus": "Central US",
    "northeurope": "North Europe",
    "westeurope": "West Europe",
    "uksouth": "UK South",
    "ukwest": "UK West",
  };
  return locationMap[location.toLowerCase()] || location;
}

/**
 * View levels for the org chart
 */
const VIEW_LEVELS = {
  SUBSCRIPTION: "subscription",
  RESOURCE_GROUP: "resourceGroup",
  RESOURCE: "resource",
  FOCUSED: "focused", // Shows single resource with parent hierarchy
};

/**
 * Build subscription-level view - shows resource groups
 */
function buildSubscriptionView(allResources, subscriptionId, subscriptionName, currentResourceRG, showAll = false) {
  const nodes = [];
  const edges = [];

  const rgMap = new Map();
  allResources.forEach(r => {
    if (r.subscriptionId?.toLowerCase() === subscriptionId?.toLowerCase()) {
      const rg = r.resourceGroup?.toLowerCase() || "unknown";
      if (!rgMap.has(rg)) {
        rgMap.set(rg, { name: r.resourceGroup || "Unknown", count: 0, totalCost: 0 });
      }
      const rgData = rgMap.get(rg);
      rgData.count++;
      rgData.totalCost += r.cost || 0;
    }
  });

  const resourceGroups = Array.from(rgMap.entries());
  const maxShow = showAll ? resourceGroups.length : 8;
  const displayRGs = resourceGroups.slice(0, maxShow);
  const hasMore = !showAll && resourceGroups.length > maxShow;

  const nodeWidth = 180;
  const horizontalGap = 40;
  const verticalGap = 100;
  const totalWidth = displayRGs.length * nodeWidth + (displayRGs.length - 1) * horizontalGap;
  const startX = -totalWidth / 2 + nodeWidth / 2;

  const displayName = subscriptionName || subscriptionId;
  const totalResources = allResources.filter(r => r.subscriptionId?.toLowerCase() === subscriptionId?.toLowerCase());
  const totalCost = totalResources.reduce((sum, r) => sum + (r.cost || 0), 0);

  nodes.push({
    id: "subscription",
    type: "resourceNode",
    position: { x: 0, y: 0 },
    data: {
      label: displayName?.length > 20 ? displayName.substring(0, 20) + "..." : displayName,
      fullName: subscriptionName ? `${subscriptionName} (${subscriptionId})` : subscriptionId,
      icon: getTypeIcon("subscription"),
      nodeType: "subscription",
      count: totalResources.length,
      cost: totalCost,
    },
  });

  displayRGs.forEach(([rgKey, rgData], idx) => {
    const isCurrent = rgKey === currentResourceRG?.toLowerCase();
    const rgNodeId = `rg-${idx}`;
    const xPos = startX + idx * (nodeWidth + horizontalGap);

    nodes.push({
      id: rgNodeId,
      type: "resourceNode",
      position: { x: xPos, y: verticalGap + 60 },
      data: {
        label: rgData.name.length > 18 ? rgData.name.substring(0, 18) + "..." : rgData.name,
        fullName: rgData.name,
        icon: getTypeIcon("resourceGroup"),
        nodeType: "resourceGroup",
        count: rgData.count,
        cost: rgData.totalCost,
        clickable: true,
        rgName: rgData.name,
        isCurrent,
      },
    });

    // Faint edges, highlighted for current
    edges.push({
      id: `edge-sub-${rgNodeId}`,
      source: "subscription",
      target: rgNodeId,
      type: "smoothstep",
      animated: isCurrent,
      style: { stroke: isCurrent ? "#f59e0b" : "#94a3b8", strokeWidth: isCurrent ? 3 : 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: isCurrent ? "#f59e0b" : "#94a3b8" },
    });
  });

  if (hasMore) {
    nodes.push({
      id: "more-rgs",
      type: "resourceNode",
      position: { x: startX + displayRGs.length * (nodeWidth + horizontalGap), y: verticalGap + 60 },
      data: {
        label: `+${resourceGroups.length - 8} more`,
        icon: Icons.plus,
        nodeType: "more",
        clickable: true,
        action: "showAllRGs",
      },
    });
  }

  return { nodes, edges };
}

/**
 * Build resource group level view with dependencies
 */
function buildResourceGroupView(allResources, resourceGroup, subscriptionName, currentResource, showAll = false) {
  const nodes = [];
  const edges = [];

  const rgResources = allResources.filter(r =>
    r.resourceGroup?.toLowerCase() === resourceGroup?.toLowerCase()
  );

  const maxShow = showAll ? rgResources.length : 7;
  let displayResources = rgResources;
  let hasMore = false;

  if (!showAll && rgResources.length > maxShow) {
    const currentIdx = rgResources.findIndex(r =>
      r.id?.toLowerCase() === currentResource?.id?.toLowerCase()
    );
    if (currentIdx >= 0) {
      const start = Math.max(0, currentIdx - Math.floor(maxShow / 2));
      const end = Math.min(rgResources.length, start + maxShow);
      displayResources = rgResources.slice(start, end);
    } else {
      displayResources = rgResources.slice(0, maxShow);
    }
    hasMore = true;
  }

  const nodeWidth = 200;
  const horizontalGap = 50;
  const verticalGap = 100;
  const totalWidth = displayResources.length * nodeWidth + (displayResources.length - 1) * horizontalGap;
  const startX = -totalWidth / 2 + nodeWidth / 2;

  // Subscription node
  nodes.push({
    id: "subscription",
    type: "resourceNode",
    position: { x: 0, y: 0 },
    data: {
      label: subscriptionName?.length > 20 ? subscriptionName.substring(0, 20) + "..." : (subscriptionName || "Subscription"),
      fullName: subscriptionName,
      icon: getTypeIcon("subscription"),
      nodeType: "subscription",
      clickable: true,
    },
  });

  // Resource group node
  const rgCost = rgResources.reduce((sum, r) => sum + (r.cost || 0), 0);
  nodes.push({
    id: "resource-group",
    type: "resourceNode",
    position: { x: 0, y: verticalGap + 60 },
    data: {
      label: resourceGroup,
      icon: getTypeIcon("resourceGroup"),
      nodeType: "resourceGroup",
      count: rgResources.length,
      cost: rgCost,
    },
  });

  // Faint edge from subscription to resource group
  edges.push({
    id: "edge-sub-rg",
    source: "subscription",
    target: "resource-group",
    type: "smoothstep",
    style: { stroke: "#94a3b8", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
  });

  // Resource nodes with enhanced data
  const resourceY = (verticalGap + 60) * 2;
  const resourceIdToNodeId = new Map();

  displayResources.forEach((resource, idx) => {
    const isCurrent = resource.id?.toLowerCase() === currentResource?.id?.toLowerCase();
    const resourceNodeId = `resource-${idx}`;
    const shortType = resource.type?.split("/").pop() || "resource";
    const xPos = startX + idx * (nodeWidth + horizontalGap);

    resourceIdToNodeId.set(resource.id?.toLowerCase(), resourceNodeId);

    const dependencies = detectDependencies(resource, allResources);
    const health = getResourceHealth(resource);

    nodes.push({
      id: resourceNodeId,
      type: "resourceNode",
      position: { x: xPos, y: resourceY },
      data: {
        label: resource.name?.length > 16 ? resource.name.substring(0, 16) + "..." : resource.name,
        fullName: resource.name,
        icon: getTypeIcon("resource", resource.type),
        nodeType: "resource",
        resourceType: shortType,
        fullType: resource.type,
        location: formatLocation(resource.location),
        cost: resource.cost,
        health,
        tags: resource.tags,
        dependencies,
        isCurrent,
        clickable: true,
        resourceId: resource.id,
        sku: resource.sku?.name || resource.sku?.tier,
        kind: resource.kind,
        provisioningState: resource.provisioningState,
      },
    });

    // Faint edges connecting resources to RG, highlighted for current
    edges.push({
      id: `edge-rg-${resourceNodeId}`,
      source: "resource-group",
      target: resourceNodeId,
      type: "smoothstep",
      animated: isCurrent,
      style: { stroke: isCurrent ? "#f59e0b" : "#94a3b8", strokeWidth: isCurrent ? 3 : 1.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: isCurrent ? "#f59e0b" : "#94a3b8" },
    });
  });

  // Add dependency edges between resources
  displayResources.forEach((resource, idx) => {
    const sourceNodeId = `resource-${idx}`;
    const dependencies = detectDependencies(resource, allResources);

    dependencies.forEach(dep => {
      const targetNodeId = resourceIdToNodeId.get(dep.id?.toLowerCase());
      if (targetNodeId && targetNodeId !== sourceNodeId) {
        edges.push({
          id: `dep-${sourceNodeId}-${targetNodeId}`,
          source: sourceNodeId,
          target: targetNodeId,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#a855f7", strokeWidth: 1, strokeDasharray: "5,5" },
          markerEnd: { type: MarkerType.ArrowClosed, color: "#a855f7", width: 15, height: 15 },
          label: dep.type,
          labelStyle: { fontSize: 9, fill: "#a855f7" },
          labelBgStyle: { fill: "#faf5ff", fillOpacity: 0.9 },
        });
      }
    });
  });

  if (hasMore) {
    nodes.push({
      id: "more-resources",
      type: "resourceNode",
      position: { x: startX + displayResources.length * (nodeWidth + horizontalGap), y: resourceY },
      data: {
        label: `+${rgResources.length - displayResources.length} more`,
        icon: Icons.plus,
        nodeType: "more",
        clickable: true,
        action: "showAllResources",
      },
    });
  }

  return { nodes, edges };
}

/**
 * Build focused view - shows single resource with parent hierarchy (org chart style)
 */
function buildFocusedView(allResources, focusedResource, subscriptionName) {
  const nodes = [];
  const edges = [];

  if (!focusedResource) return { nodes, edges };

  const verticalGap = 120;
  const dependencies = detectDependencies(focusedResource, allResources);
  const health = getResourceHealth(focusedResource);
  const shortType = focusedResource.type?.split("/").pop() || "resource";

  // Subscription node at top
  nodes.push({
    id: "subscription",
    type: "resourceNode",
    position: { x: 0, y: 0 },
    data: {
      label: subscriptionName?.length > 25 ? subscriptionName.substring(0, 25) + "..." : (subscriptionName || "Subscription"),
      fullName: subscriptionName,
      icon: getTypeIcon("subscription"),
      nodeType: "subscription",
      clickable: true,
    },
  });

  // Resource Group node in middle
  nodes.push({
    id: "resource-group",
    type: "resourceNode",
    position: { x: 0, y: verticalGap },
    data: {
      label: focusedResource.resourceGroup,
      fullName: focusedResource.resourceGroup,
      icon: getTypeIcon("resourceGroup"),
      nodeType: "resourceGroup",
      clickable: true,
      rgName: focusedResource.resourceGroup,
    },
  });

  // Focused resource node (expanded) at bottom
  nodes.push({
    id: "focused-resource",
    type: "resourceNode",
    position: { x: 0, y: verticalGap * 2 },
    data: {
      label: focusedResource.name,
      fullName: focusedResource.name,
      icon: getTypeIcon("resource", focusedResource.type),
      nodeType: "resource",
      resourceType: shortType,
      fullType: focusedResource.type,
      location: formatLocation(focusedResource.location),
      cost: focusedResource.cost,
      health,
      tags: focusedResource.tags,
      dependencies,
      isExpanded: true,
      sku: focusedResource.sku?.name || focusedResource.sku?.tier,
      kind: focusedResource.kind,
      provisioningState: focusedResource.provisioningState,
      resourceId: focusedResource.id,
    },
  });

  // Edges connecting the hierarchy (faint lines)
  edges.push({
    id: "edge-sub-rg",
    source: "subscription",
    target: "resource-group",
    type: "smoothstep",
    style: { stroke: "#94a3b8", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#94a3b8" },
  });

  edges.push({
    id: "edge-rg-resource",
    source: "resource-group",
    target: "focused-resource",
    type: "smoothstep",
    style: { stroke: "#10b981", strokeWidth: 3 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10b981" },
  });

  return { nodes, edges };
}

/**
 * MiniMap node color function
 */
function minimapNodeColor(node) {
  const colors = {
    subscription: "#8b5cf6",
    resourceGroup: "#3b82f6",
    resource: "#10b981",
    more: "#94a3b8",
  };
  return colors[node.data?.nodeType] || "#94a3b8";
}

/**
 * Generate Azure Portal URL for a resource
 */
function getAzurePortalUrl(resourceId, subscriptionId, resourceGroup) {
  const baseUrl = "https://portal.azure.com";

  if (resourceId) {
    // Full resource URL
    return `${baseUrl}/#@/resource${resourceId}`;
  } else if (subscriptionId && resourceGroup) {
    // Resource group URL
    return `${baseUrl}/#@/resource/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}`;
  } else if (subscriptionId) {
    // Subscription URL
    return `${baseUrl}/#@/resource/subscriptions/${subscriptionId}`;
  }
  return null;
}

/**
 * Inner component that uses useReactFlow hook
 */
function ResourceGraphInner({ resource }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allResources, setAllResources] = useState([]);
  const [subscriptionName, setSubscriptionName] = useState(null);
  const [viewLevel, setViewLevel] = useState(VIEW_LEVELS.RESOURCE_GROUP);
  const [selectedRG, setSelectedRG] = useState(null);
  const [showAllItems, setShowAllItems] = useState(false);
  const [showDependencies, setShowDependencies] = useState(true);
  const [focusedResource, setFocusedResource] = useState(null);
  const reactFlowInstance = useRef(null);
  const prevViewLevel = useRef(viewLevel);

  useEffect(() => {
    async function loadResources() {
      if (!resource) return;

      setLoading(true);
      setError(null);

      try {
        const [resourcesResponse, subscriptions] = await Promise.all([
          fetchAllResources({}),
          api.fetchSubscriptions().catch(() => [])
        ]);

        const resources = resourcesResponse.resources || [];
        setAllResources(resources);

        const subId = resource.subscriptionId?.toLowerCase();
        const subscription = subscriptions.find(s =>
          s.subscriptionId?.toLowerCase() === subId || s.id?.toLowerCase()?.includes(subId)
        );
        setSubscriptionName(subscription?.displayName || subscription?.name || null);

        setViewLevel(VIEW_LEVELS.RESOURCE_GROUP);
        setSelectedRG(resource.resourceGroup);
      } catch (err) {
        console.error("Failed to load resources:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, [resource]);

  useEffect(() => {
    if (!resource || allResources.length === 0) return;

    let result;
    if (viewLevel === VIEW_LEVELS.FOCUSED && focusedResource) {
      result = buildFocusedView(
        allResources,
        focusedResource,
        subscriptionName
      );
    } else if (viewLevel === VIEW_LEVELS.SUBSCRIPTION) {
      result = buildSubscriptionView(
        allResources,
        resource.subscriptionId,
        subscriptionName,
        resource.resourceGroup,
        showAllItems
      );
    } else {
      result = buildResourceGroupView(
        allResources,
        selectedRG || resource.resourceGroup,
        subscriptionName,
        resource,
        showAllItems
      );
    }

    // Filter out dependency edges if disabled
    if (!showDependencies) {
      result.edges = result.edges.filter(e => !e.id.startsWith("dep-"));
    }

    setNodes(result.nodes);
    setEdges(result.edges);

    // Fit view when view level changes
    if (prevViewLevel.current !== viewLevel && reactFlowInstance.current) {
      setTimeout(() => {
        reactFlowInstance.current?.fitView({ padding: 0.2, duration: 300 });
      }, 50);
    }
    prevViewLevel.current = viewLevel;
  }, [viewLevel, selectedRG, allResources, resource, subscriptionName, showAllItems, showDependencies, focusedResource, setNodes, setEdges]);

  const onInit = useCallback((instance) => {
    reactFlowInstance.current = instance;
    setTimeout(() => {
      instance.fitView({ padding: 0.2, duration: 500 });
    }, 100);
  }, []);

  const onNodeClick = useCallback((_event, node) => {
    const { data } = node;

    // Handle leaf node (resource) click - switch to focused view
    if (data.nodeType === "resource" && data.resourceId) {
      // If already in focused view and clicking the focused resource, go back to RG view
      if (viewLevel === VIEW_LEVELS.FOCUSED && data.isExpanded) {
        setFocusedResource(null);
        setViewLevel(VIEW_LEVELS.RESOURCE_GROUP);
        return;
      }
      // Find the full resource object and switch to focused view
      const clickedResource = allResources.find(r => r.id === data.resourceId);
      if (clickedResource) {
        setFocusedResource(clickedResource);
        setViewLevel(VIEW_LEVELS.FOCUSED);
      }
      return;
    }

    if (!data.clickable) return;

    if (data.nodeType === "more" && data.action) {
      setShowAllItems(true);
    } else if (data.nodeType === "subscription") {
      setShowAllItems(false);
      setFocusedResource(null);
      setViewLevel(VIEW_LEVELS.SUBSCRIPTION);
    } else if (data.nodeType === "resourceGroup" && data.rgName) {
      setShowAllItems(false);
      setFocusedResource(null);
      setSelectedRG(data.rgName);
      setViewLevel(VIEW_LEVELS.RESOURCE_GROUP);
    }
  }, [viewLevel, allResources]);

  // Get Azure portal URL for current view
  const currentPortalUrl = focusedResource
    ? getAzurePortalUrl(focusedResource.id)
    : viewLevel === VIEW_LEVELS.RESOURCE_GROUP
      ? getAzurePortalUrl(null, resource?.subscriptionId, selectedRG || resource?.resourceGroup)
      : getAzurePortalUrl(null, resource?.subscriptionId);

  if (loading) {
    return (
      <div className="resource-graph-container">
        <div className="graph-loading">
          <div className="graph-loading-spinner" />
          Loading resource hierarchy...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="resource-graph-container">
        <div className="graph-error">
          <strong>Error loading resources</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="resource-graph-container">
        <div className="graph-empty">No resource hierarchy available</div>
      </div>
    );
  }

  return (
    <div className="resource-graph-container">
      <div className="graph-header">
        <div className="graph-breadcrumb">
          <button
            className={`breadcrumb-item ${viewLevel === VIEW_LEVELS.SUBSCRIPTION ? "active" : ""}`}
            onClick={() => { setShowAllItems(false); setFocusedResource(null); setViewLevel(VIEW_LEVELS.SUBSCRIPTION); }}
          >
            {subscriptionName?.substring(0, 15) || "Subscription"}
          </button>
          <span className="breadcrumb-sep">/</span>
          <button
            className={`breadcrumb-item ${viewLevel === VIEW_LEVELS.RESOURCE_GROUP ? "active" : ""}`}
            onClick={() => {
              setShowAllItems(false);
              setFocusedResource(null);
              setSelectedRG(resource.resourceGroup);
              setViewLevel(VIEW_LEVELS.RESOURCE_GROUP);
            }}
          >
            {(selectedRG || resource.resourceGroup)?.substring(0, 20) || "Resource Group"}
          </button>
          {viewLevel === VIEW_LEVELS.FOCUSED && focusedResource && (
            <>
              <span className="breadcrumb-sep">/</span>
              <button className="breadcrumb-item active">
                {focusedResource.name?.substring(0, 20) || "Resource"}
              </button>
            </>
          )}
        </div>
        <div className="graph-controls">
          <label className="graph-toggle">
            <input
              type="checkbox"
              checked={showDependencies}
              onChange={(e) => setShowDependencies(e.target.checked)}
            />
            <span>Dependencies</span>
          </label>
          {currentPortalUrl && (
            <a
              href={currentPortalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="graph-portal-link"
              title="Open in Azure Portal"
            >
              Azure Portal
            </a>
          )}
        </div>
      </div>

      <div className="graph-flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onInit={onInit}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          zoomOnScroll={true}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e2e8f0" gap={20} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={minimapNodeColor}
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{ backgroundColor: "#f8fafc", top: 10, right: 10, bottom: "auto", left: "auto" }}
            position="top-right"
          />
        </ReactFlow>
      </div>

      <div className="graph-legend-bar">
        <div className="legend-item">
          <span className="legend-dot subscription" />
          <span>Subscription</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot resource-group" />
          <span>Resource Group</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot resource" />
          <span>Resource</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot current" />
          <span>Current</span>
        </div>
        <div className="legend-item">
          <span className="legend-line dependency" />
          <span>Dependency</span>
        </div>
        <div className="legend-item health-legend">
          <span className="health-dot" style={{ backgroundColor: "#10b981" }} />
          <span className="health-dot" style={{ backgroundColor: "#f59e0b" }} />
          <span className="health-dot" style={{ backgroundColor: "#ef4444" }} />
          <span>Health</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Resource Graph wrapper with ReactFlowProvider
 */
function ResourceGraph({ resource }) {
  return (
    <ReactFlowProvider>
      <ResourceGraphInner resource={resource} />
    </ReactFlowProvider>
  );
}

export default ResourceGraph;
