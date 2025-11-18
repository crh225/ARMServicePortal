// Blueprint catalog used by the API and GitHub provisioning.

export const BLUEPRINTS = [
  {
    id: "azure-rg-basic",
    version: "1.0.0",
    displayName: "Azure Resource Group (basic)",
    description: "Creates a single Resource Group using a standardized naming convention.",
    moduleSource: "../../modules/azure-rg-basic",
    variables: [
      {
        name: "project_name",
        label: "Project Name",
        type: "string",
        required: true
      },
      {
        name: "environment",
        label: "Environment",
        type: "select",
        required: true,
        options: ["dev", "qa", "staging", "prod"],
        default: "dev"
      },
      {
        name: "location",
        label: "Location",
        type: "string",
        required: true,
        default: "eastus2"
      }
    ],
    outputs: [
      {
        name: "resource_group_name",
        description: "The name of the created resource group"
      }
    ]
  },
  {
    id: "azure-storage-basic",
    version: "1.0.0",
    displayName: "Azure Storage Account (basic)",
    description: "Creates a general-purpose v2 Storage Account with standard settings in an existing Resource Group.",
    moduleSource: "../../modules/azure-storage-basic",
    variables: [
      {
        name: "project_name",
        label: "Project Name",
        type: "string",
        required: true
      },
      {
        name: "environment",
        label: "Environment",
        type: "select",
        required: true,
        options: ["dev", "qa", "staging", "prod"],
        default: "dev"
      },
      {
        name: "resource_group_name",
        label: "Resource Group Name",
        type: "string",
        required: true
      },
      {
        name: "location",
        label: "Location",
        type: "string",
        required: true,
        default: "eastus2"
      },
      {
        name: "account_tier",
        label: "Account Tier",
        type: "select",
        required: true,
        options: ["Standard","Premium"],
        default: "Standard"
      },
      {
        name: "replication_type",
        label: "Replication Type",
        type: "select",
        required: true,
        options: ["LRS","GRS","RAGRS","ZRS"],
        default: "LRS"
      }
    ],
    outputs: [
      {
        name: "storage_account_name",
        description: "The name of the created storage account"
      },
      {
        name: "primary_blob_endpoint",
        description: "The endpoint URL for blob storage"
      }
    ]
  },
  {
    id: "azure-key-vault-basic",
    version: "1.0.0",
    displayName: "Azure Key Vault (basic RBAC)",
    description:
      "Creates an Azure Key Vault using RBAC authorization in an existing Resource Group.",
    moduleSource: "../../modules/azure-key-vault-basic",
    variables: [
      {
        name: "project_name",
        label: "Project Name",
        type: "string",
        required: true
      },
      {
        name: "environment",
        label: "Environment",
        type: "select",
        required: true,
        options: ["dev", "prod"],
        default: "dev"
      },
      {
        name: "resource_group_name",
        label: "Resource Group Name",
        type: "string",
        required: true
      },
      {
        name: "location",
        label: "Location",
        type: "string",
        required: true,
        default: "eastus2"
      },
      {
        name: "sku_name",
        label: "SKU",
        type: "select",
        required: true,
        options: ["standard", "premium"],
        default: "standard"
      },
      {
        name: "soft_delete_retention_days",
        label: "Soft Delete Retention (days)",
        type: "string",
        required: false,
        default: "7"
      },
      {
        name: "purge_protection_enabled",
        label: "Enable Purge Protection",
        type: "select",
        required: false,
        options: ["true", "false"],
        default: "true"
      }
    ]
  },
  {
    id: "azure-static-site",
    version: "1.0.0",
    displayName: "Static Website",
    description: "Host a static website on Azure Storage with optional CDN support. Perfect for SPAs, documentation sites, and marketing pages.",
    category: "Web",
    moduleSource: "../../infra/modules/azure-static-site",
    variables: [
      {
        name: "project_name",
        label: "Project Name",
        type: "string",
        required: true
      },
      {
        name: "environment",
        label: "Environment",
        type: "select",
        required: true,
        options: ["dev", "qa", "staging", "prod"],
        default: "dev"
      },
      {
        name: "resource_group_name",
        label: "Resource Group Name",
        type: "string",
        required: true
      },
      {
        name: "location",
        label: "Location",
        type: "string",
        required: true,
        default: "eastus2"
      },
      {
        name: "index_document",
        label: "Index Document",
        type: "string",
        required: false,
        default: "index.html"
      },
      {
        name: "error_document",
        label: "Error Document",
        type: "string",
        required: false,
        default: "404.html"
      },
      {
        name: "enable_cdn",
        label: "Enable CDN",
        type: "select",
        required: false,
        options: ["true", "false"],
        default: "false"
      }
    ],
    outputs: [
      {
        name: "primary_web_endpoint",
        description: "Primary website URL"
      },
      {
        name: "storage_account_name",
        description: "Storage account name"
      },
      {
        name: "resource_group_name",
        description: "Resource group name"
      },
      {
        name: "cdn_endpoint",
        description: "CDN endpoint URL (if CDN enabled)"
      }
    ]
  }
];

/**
 * Compare semantic versions (e.g., "1.0.0", "1.2.3")
 * Returns: 1 if a > b, -1 if a < b, 0 if equal
 */
function compareSemver(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

/**
 * Get a blueprint by ID and optional version
 * @param {string} id - Blueprint ID
 * @param {string} [version] - Optional version (e.g., "1.0.0"). If not provided, returns latest version.
 * @returns {Object|null} - Blueprint object or null if not found
 */
export function getBlueprintById(id, version) {
  const candidates = BLUEPRINTS.filter((b) => b.id === id);
  if (candidates.length === 0) return null;

  if (!version) {
    // Return latest by semver
    return candidates
      .slice()
      .sort((a, b) => compareSemver(b.version, a.version))[0];
  }

  return (
    candidates.find((b) => b.version === version) ||
    null
  );
}

/**
 * Get all versions of a blueprint by ID
 * @param {string} id - Blueprint ID
 * @returns {Array} - Array of version strings sorted descending
 */
export function getBlueprintVersions(id) {
  return BLUEPRINTS
    .filter((b) => b.id === id)
    .map((b) => b.version)
    .sort((a, b) => compareSemver(b, a));
}

/**
 * Get unique blueprint IDs (returns only latest version of each)
 * @returns {Array} - Array of blueprint objects (latest version only)
 */
export function getLatestBlueprints() {
  const uniqueIds = [...new Set(BLUEPRINTS.map((b) => b.id))];
  return uniqueIds.map((id) => getBlueprintById(id));
}
