// Blueprint catalog used by the API and GitHub provisioning.

export const BLUEPRINTS = [
  {
    id: "azure-rg-basic",
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
        options: ["dev","prod"],
        default: "dev"
      },
      {
        name: "location",
        label: "Location",
        type: "string",
        required: true,
        default: "eastus2"
      }
    ]
  },
  {
    id: "azure-storage-basic",
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
        options: ["dev","prod"],
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
    ]
  },
  {
  id: "azure-key-vault-basic",
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
}
];

export function getBlueprintById(id) {
  return BLUEPRINTS.find((b) => b.id === id) || null;
}
