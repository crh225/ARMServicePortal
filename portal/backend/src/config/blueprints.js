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
    version: "0.0.1",
    displayName: "Static Website",
    description: "Host a static website on Azure Storage with optional CDN support. Perfect for SPAs, documentation sites, and marketing pages.",
    category: "Web",
    moduleSource: "../../modules/azure-static-site",
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
  },
  {
    id: "azure-aci",
    version: "0.0.1",
    displayName: "Azure Container Instance",
    description: "Deploy a containerized application using Azure Container Instances. Perfect for simple apps, batch jobs, and development environments.",
    category: "Compute",
    moduleSource: "../../modules/azure-aci",
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
        name: "container_image",
        label: "Container Image",
        type: "string",
        required: true,
        default: "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
      },
      {
        name: "cpu_cores",
        label: "CPU Cores",
        type: "select",
        required: true,
        options: ["0.5", "1", "2", "4"],
        default: "1"
      },
      {
        name: "memory_gb",
        label: "Memory (GB)",
        type: "select",
        required: true,
        options: ["0.5", "1", "2", "4", "8"],
        default: "1"
      },
      {
        name: "port",
        label: "Container Port",
        type: "string",
        required: false,
        default: "80"
      },
      {
        name: "ip_address_type",
        label: "IP Address Type",
        type: "select",
        required: true,
        options: ["Public", "Private", "None"],
        default: "Public"
      },
      {
        name: "restart_policy",
        label: "Restart Policy",
        type: "select",
        required: false,
        options: ["Always", "OnFailure", "Never"],
        default: "Always"
      },
      {
        name: "environment_variables",
        label: "Environment Variables (JSON)",
        type: "string",
        required: false,
        default: "{}"
      }
    ],
    outputs: [
      {
        name: "container_group_name",
        description: "Container group name"
      },
      {
        name: "fqdn",
        description: "Fully qualified domain name (if public IP enabled)"
      },
      {
        name: "ip_address",
        description: "IP address of the container"
      },
      {
        name: "resource_group_name",
        description: "Resource group name"
      }
    ]
  },
  {
    id: "azure-postgres-flexible",
    version: "0.0.1",
    displayName: "PostgreSQL Flexible Server",
    description: "Managed PostgreSQL database with automatic backups, high availability options, and enterprise security. Perfect for web apps, microservices, and data-driven applications.",
    category: "Database",
    moduleSource: "../../modules/azure-postgres-flexible",
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
        name: "postgres_version",
        label: "PostgreSQL Version",
        type: "select",
        required: true,
        options: ["11", "12", "13", "14", "15", "16"],
        default: "16"
      },
      {
        name: "sku_name",
        label: "SKU",
        type: "select",
        required: true,
        options: [
          "B_Standard_B1ms",
          "B_Standard_B2s",
          "GP_Standard_D2s_v3",
          "GP_Standard_D4s_v3",
          "MO_Standard_E2s_v3"
        ],
        default: "B_Standard_B1ms"
      },
      {
        name: "storage_mb",
        label: "Storage Size (MB)",
        type: "select",
        required: true,
        options: ["32768", "65536", "131072", "262144", "524288", "1048576"],
        default: "32768"
      },
      {
        name: "backup_retention_days",
        label: "Backup Retention (days)",
        type: "select",
        required: false,
        options: ["7", "14", "21", "28", "35"],
        default: "7"
      },
      {
        name: "geo_redundant_backup",
        label: "Geo-Redundant Backup",
        type: "select",
        required: false,
        options: ["true", "false"],
        default: "false"
      },
      {
        name: "admin_username",
        label: "Admin Username",
        type: "string",
        required: false,
        default: "psqladmin"
      },
      {
        name: "high_availability_mode",
        label: "High Availability",
        type: "select",
        required: false,
        options: ["disabled", "SameZone", "ZoneRedundant"],
        default: "disabled"
      },
      {
        name: "database_name",
        label: "Database Name",
        type: "string",
        required: false,
        default: "appdb"
      }
    ],
    outputs: [
      {
        name: "server_name",
        description: "PostgreSQL server name"
      },
      {
        name: "server_fqdn",
        description: "Server fully qualified domain name"
      },
      {
        name: "database_name",
        description: "Database name"
      },
      {
        name: "admin_username",
        description: "Administrator username"
      },
      {
        name: "admin_password",
        description: "Administrator password (sensitive)"
      },
      {
        name: "connection_string",
        description: "PostgreSQL connection string (sensitive)"
      }
    ]
  },
  {
    id: "azure-webapp-stack",
    version: "0.0.1",
    displayName: "Full Stack Web Application",
    description: "Complete application stack: Resource Group + Storage Account + Container Instance + Key Vault. Deploy an entire app environment in one request.",
    category: "Stacks",
    type: "stack",
    components: [
      {
        id: "rg",
        blueprint: "azure-rg-basic",
        variables: {
          project_name: "${stack.project_name}",
          environment: "${stack.environment}",
          location: "${stack.location}"
        }
      },
      {
        id: "storage",
        blueprint: "azure-storage-basic",
        dependsOn: ["rg"],
        variables: {
          project_name: "${stack.project_name}",
          environment: "${stack.environment}",
          resource_group_name: "${rg.resource_group_name}",
          location: "${stack.location}",
          account_tier: "Standard",
          replication_type: "LRS"
        }
      },
      {
        id: "keyvault",
        blueprint: "azure-key-vault-basic",
        dependsOn: ["rg"],
        variables: {
          project_name: "${stack.project_name}",
          environment: "${stack.environment}",
          resource_group_name: "${rg.resource_group_name}",
          location: "${stack.location}",
          sku_name: "${stack.keyvault_sku}",
          soft_delete_retention_days: "7",
          purge_protection_enabled: "true"
        }
      },
      {
        id: "app",
        blueprint: "azure-aci",
        dependsOn: ["rg"],
        variables: {
          project_name: "${stack.project_name}",
          environment: "${stack.environment}",
          resource_group_name: "${rg.resource_group_name}",
          location: "${stack.location}",
          container_image: "${stack.container_image}",
          cpu_cores: "${stack.cpu_cores}",
          memory_gb: "${stack.memory_gb}",
          port: "${stack.container_port}",
          ip_address_type: "Public",
          restart_policy: "Always",
          environment_variables: "${stack.environment_variables}"
        }
      }
    ],
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
      },
      {
        name: "container_image",
        label: "Container Image",
        type: "string",
        required: true,
        default: "mcr.microsoft.com/azuredocs/aci-helloworld:latest"
      },
      {
        name: "cpu_cores",
        label: "CPU Cores",
        type: "select",
        required: true,
        options: ["0.5", "1", "2", "4"],
        default: "1"
      },
      {
        name: "memory_gb",
        label: "Memory (GB)",
        type: "select",
        required: true,
        options: ["1", "2", "4", "8"],
        default: "2"
      },
      {
        name: "container_port",
        label: "Container Port",
        type: "string",
        required: false,
        default: "80"
      },
      {
        name: "keyvault_sku",
        label: "Key Vault SKU",
        type: "select",
        required: true,
        options: ["standard", "premium"],
        default: "standard"
      },
      {
        name: "environment_variables",
        label: "Container Environment Variables (JSON)",
        type: "string",
        required: false,
        default: "{}"
      }
    ],
    outputs: [
      {
        name: "resource_group_name",
        description: "Resource group name",
        source: "rg.resource_group_name"
      },
      {
        name: "storage_account_name",
        description: "Storage account name",
        source: "storage.storage_account_name"
      },
      {
        name: "container_fqdn",
        description: "Container FQDN",
        source: "app.fqdn"
      },
      {
        name: "container_ip",
        description: "Container IP address",
        source: "app.ip_address"
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
