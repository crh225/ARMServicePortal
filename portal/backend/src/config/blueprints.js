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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
      },
      {
        name: "location",
        label: "Location",
        type: "select",
        required: true,
        options: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus", "northcentralus", "southcentralus", "westcentralus"],
        default: "eastus2"
      }
    ],
    outputs: [
      {
        name: "resource_group_name",
        description: "The name of the created resource group"
      }
    ],
    estimatedMonthlyCost: 0
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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
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
        type: "select",
        required: true,
        options: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus", "northcentralus", "southcentralus", "westcentralus"],
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
    ],
    estimatedMonthlyCost: 2
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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
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
        type: "select",
        required: true,
        options: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus", "northcentralus", "southcentralus", "westcentralus"],
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
    ],
    estimatedMonthlyCost: 0.03
  },
  {
    id: "azure-static-site",
    version: "1.0.0",
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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
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
        type: "select",
        required: true,
        options: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus", "northcentralus", "southcentralus", "westcentralus"],
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
    ],
    estimatedMonthlyCost: 0.10
  },
  {
    id: "azure-frontdoor",
    version: "0.0.1",
    displayName: "Azure Front Door",
    description: "Creates Azure Front Door with custom domain support, HTTPS, and CDN capabilities. Perfect for serving static websites with custom domains.",
    category: "Networking",
    moduleSource: "../../modules/azure-frontdoor",
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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
      },
      {
        name: "resource_group_name",
        label: "Resource Group Name",
        type: "string",
        required: true
      },
      {
        name: "origin_hostname",
        label: "Origin Hostname",
        type: "string",
        required: true,
        placeholder: "example: mystorageaccount.z20.web.core.windows.net"
      },
      {
        name: "custom_domain",
        label: "Custom Domain (optional)",
        type: "string",
        required: false,
        placeholder: "example: portal.chrishouse.io"
      },
      {
        name: "sku_name",
        label: "SKU",
        type: "select",
        required: false,
        options: ["Standard_AzureFrontDoor", "Premium_AzureFrontDoor"],
        default: "Standard_AzureFrontDoor"
      }
    ],
    outputs: [
      {
        name: "frontdoor_endpoint_hostname",
        description: "Front Door endpoint hostname"
      },
      {
        name: "custom_domain_validation_token",
        description: "Validation token for custom domain (add as TXT record: _dnsauth.yourdomain.com)"
      },
      {
        name: "custom_domain_name",
        description: "Custom domain name"
      }
    ],
    estimatedMonthlyCost: 36.50
  },
  {
    id: "azure-cdn",
    version: "1.0.0",
    displayName: "Azure CDN",
    description: "Cost-effective content delivery network for static websites. Supports custom domains with HTTPS, compression, and SPA routing. 95% cheaper than Front Door for low-traffic sites.",
    category: "Networking",
    icon: "azure-cdn",
    moduleSource: "../../modules/azure-cdn",
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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
      },
      {
        name: "resource_group_name",
        label: "Resource Group Name",
        type: "string",
        required: true
      },
      {
        name: "origin_hostname",
        label: "Origin Hostname",
        type: "string",
        required: true,
        placeholder: "mystorageaccount.z20.web.core.windows.net",
        helpText: "Static website endpoint from Azure Storage"
      },
      {
        name: "custom_domain",
        label: "Custom Domain (optional)",
        type: "string",
        required: false,
        placeholder: "portal.example.com",
        helpText: "Requires DNS CNAME pointing to CDN endpoint"
      },
      {
        name: "sku",
        label: "CDN SKU",
        type: "select",
        required: false,
        options: ["Standard_Microsoft", "Standard_Akamai", "Standard_Verizon", "Premium_Verizon"],
        default: "Standard_Microsoft",
        helpText: "Standard_Microsoft is cheapest (~$0.08/GB). Premium adds advanced features."
      },
      {
        name: "optimization_type",
        label: "Optimization Type",
        type: "select",
        required: false,
        options: ["GeneralWebDelivery", "DynamicSiteAcceleration", "LargeFileDownload", "VideoOnDemandMediaStreaming"],
        default: "GeneralWebDelivery"
      },
      {
        name: "enable_https",
        label: "Enable HTTPS",
        type: "select",
        required: false,
        options: ["true", "false"],
        default: "true",
        helpText: "Free managed SSL certificate for custom domains"
      },
      {
        name: "enable_compression",
        label: "Enable Compression",
        type: "select",
        required: false,
        options: ["true", "false"],
        default: "true",
        helpText: "Compress HTML, CSS, JS, and other text content"
      },
      {
        name: "query_string_caching",
        label: "Query String Caching",
        type: "select",
        required: false,
        options: ["IgnoreQueryString", "UseQueryString", "BypassCaching"],
        default: "IgnoreQueryString"
      }
    ],
    outputs: [
      {
        name: "cdn_endpoint_hostname",
        description: "CDN endpoint hostname (*.azureedge.net)"
      },
      {
        name: "cdn_endpoint_url",
        description: "CDN endpoint URL"
      },
      {
        name: "custom_domain_url",
        description: "Custom domain URL (if configured)"
      },
      {
        name: "dns_cname_target",
        description: "DNS CNAME target - point your custom domain to this"
      }
    ],
    estimatedMonthlyCost: 0,
    costDetails: {
      description: "Pay-per-use: No monthly base fee",
      dataTransfer: "~$0.08/GB for first 10TB/month (Standard_Microsoft)",
      requests: "Free for Standard_Microsoft tier",
      comparison: "95% cheaper than Front Door ($36.50/month base) for low-traffic sites"
    }
  },
  {
    id: "azure-aci",
    version: "1.0.0",
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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
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
        type: "select",
        required: true,
        options: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus", "northcentralus", "southcentralus", "westcentralus"],
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
    ],
    estimatedMonthlyCost: 35
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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
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
        type: "select",
        required: true,
        options: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus", "northcentralus", "southcentralus", "westcentralus"],
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
        label: "Admin Username (leave blank for auto-generated)",
        type: "string",
        required: false
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
    ],
    estimatedMonthlyCost: 15
  },
  {
    id: "azure-elastic-managed",
    version: "1.0.0",
    displayName: "Azure Elastic (Managed)",
    description: "Fully managed Elasticsearch cluster with Kibana and Logstash. No infrastructure management required - Elastic handles updates, security, and scaling.",
    category: "Analytics & Monitoring",
    moduleSource: "../../modules/azure-elastic-managed",
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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
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
        type: "select",
        required: true,
        options: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus", "northcentralus", "southcentralus", "westcentralus"],
        default: "eastus2"
      },
      {
        name: "elastic_email",
        label: "Elastic Cloud Email",
        type: "string",
        required: true,
        placeholder: "admin@example.com"
      },
      {
        name: "sku_name",
        label: "SKU / Pricing Tier",
        type: "select",
        required: false,
        options: ["ess-consumption-2024_Monthly"],
        default: "ess-consumption-2024_Monthly"
      },
      {
        name: "monitoring_enabled",
        label: "Enable Monitoring",
        type: "select",
        required: false,
        options: ["true", "false"],
        default: "true"
      }
    ],
    outputs: [
      {
        name: "elasticsearch_endpoint",
        description: "Elasticsearch API endpoint for data ingestion and queries"
      },
      {
        name: "kibana_endpoint",
        description: "Kibana web interface for visualization and management"
      },
      {
        name: "elastic_deployment_id",
        description: "Azure resource ID of the Elastic deployment"
      },
      {
        name: "elastic_cloud_deployment_id",
        description: "Elastic Cloud deployment identifier",
        sensitive: true
      }
    ],
    estimatedMonthlyCost: 95
  },
  {
    id: "azure-function",
    version: "0.0.1",
    displayName: "Azure Function App",
    description: "Serverless compute for event-driven applications. Automatically scales based on demand with pay-per-execution pricing. Perfect for APIs, webhooks, scheduled tasks, and event processing.",
    category: "Compute",
    moduleSource: "../../modules/azure-function",
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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
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
        type: "select",
        required: true,
        options: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus", "northcentralus", "southcentralus", "westcentralus"],
        default: "eastus2"
      },
      {
        name: "runtime_stack",
        label: "Runtime Stack",
        type: "select",
        required: true,
        options: ["node", "dotnet", "python", "java", "powershell"],
        default: "node"
      },
      {
        name: "runtime_version",
        label: "Runtime Version",
        type: "select",
        required: true,
        options: ["18", "20", "22"],
        default: "20",
        helpText: "For Node.js: 18, 20, 22. For other runtimes, version numbers may vary."
      },
      {
        name: "os_type",
        label: "Operating System",
        type: "select",
        required: true,
        options: ["Linux", "Windows"],
        default: "Linux"
      },
      {
        name: "sku_name",
        label: "Pricing Plan",
        type: "select",
        required: true,
        options: ["Y1", "EP1", "EP2", "EP3", "B1", "S1", "P1v2", "P1v3"],
        default: "Y1",
        helpText: "Y1 = Consumption (pay per execution). EP = Elastic Premium. B/S/P = Dedicated plans."
      },
      {
        name: "always_on",
        label: "Always On",
        type: "select",
        required: false,
        options: ["true", "false"],
        default: "false",
        helpText: "Keep the function app always running (not available on Consumption plan)"
      }
    ],
    outputs: [
      {
        name: "function_app_name",
        description: "Name of the Function App"
      },
      {
        name: "function_app_url",
        description: "URL to access the Function App"
      },
      {
        name: "default_hostname",
        description: "Default hostname of the Function App"
      },
      {
        name: "storage_account_name",
        description: "Storage account used by the Function App"
      },
      {
        name: "app_service_plan_name",
        description: "App Service Plan name"
      },
      {
        name: "application_insights_name",
        description: "Application Insights instance name"
      },
      {
        name: "resource_group_name",
        description: "Resource group containing the Function App"
      }
    ],
    estimatedMonthlyCost: 0,
    costDetails: {
      consumption: "Pay-per-execution: First 1M executions/month free, then $0.20 per million. First 400,000 GB-s free, then $0.000016/GB-s.",
      premium: "EP1 starts at ~$173/month, EP2 ~$345/month, EP3 ~$690/month",
      dedicated: "B1 ~$13/month, S1 ~$73/month, P1v2 ~$81/month"
    }
  },
  {
    id: "azure-app-configuration",
    version: "1.0.0",
    displayName: "Azure App Configuration",
    description: "Centralized configuration and feature flag management service. Perfect for externalizing app settings, managing feature flags, and A/B testing across environments.",
    category: "Configuration",
    moduleSource: "../../modules/azure-app-configuration",
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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
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
        type: "select",
        required: true,
        options: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus", "northcentralus", "southcentralus", "westcentralus"],
        default: "eastus2"
      },
      {
        name: "sku",
        label: "SKU",
        type: "select",
        required: true,
        options: ["free", "standard"],
        default: "free",
        helpText: "Free: 10 MB storage, 1000 requests/day. Standard: 1 GB storage, unlimited requests."
      },
      {
        name: "soft_delete_retention_days",
        label: "Soft Delete Retention (days)",
        type: "select",
        required: false,
        options: ["1", "7"],
        default: "7",
        helpText: "Days to retain deleted configuration stores (1-7 for free, 1-90 for standard)"
      },
      {
        name: "public_network_access",
        label: "Public Network Access",
        type: "select",
        required: false,
        options: ["Enabled", "Disabled"],
        default: "Enabled"
      },
      {
        name: "local_auth_enabled",
        label: "Enable Access Keys",
        type: "select",
        required: false,
        options: ["true", "false"],
        default: "true",
        helpText: "Enable connection strings and access keys. Disable to require Azure AD only."
      }
    ],
    outputs: [
      {
        name: "app_configuration_name",
        description: "Name of the App Configuration store"
      },
      {
        name: "endpoint",
        description: "App Configuration endpoint URL"
      },
      {
        name: "primary_read_key",
        description: "Primary read-only connection string",
        sensitive: true
      },
      {
        name: "primary_write_key",
        description: "Primary read-write connection string",
        sensitive: true
      },
      {
        name: "resource_id",
        description: "Azure resource ID"
      }
    ],
    estimatedMonthlyCost: 0,
    costDetails: {
      free: "Free tier: 10 MB storage, 1,000 requests/day",
      standard: "Standard tier: $1.20/day (~$36/month) + $0.06 per 10,000 requests over 200K"
    }
  },
  {
    id: "azure-ml-workspace",
    version: "1.0.0",
    displayName: "Azure Machine Learning Workspace",
    description: "Complete Azure ML environment with workspace, storage, compute cluster, container registry, and Key Vault. Perfect for MLOps workflows, model training, and deployment.",
    category: "AI & Machine Learning",
    moduleSource: "../../modules/azure-ml-workspace",
    variables: [
      {
        name: "project_name",
        label: "Project Name",
        type: "string",
        required: true,
        placeholder: "mhd",
        helpText: "Short name for the ML project (lowercase, no spaces)"
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
        name: "subscription_id",
        label: "Azure Subscription",
        type: "string",
        required: true
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
        type: "select",
        required: true,
        options: ["eastus", "eastus2", "westus", "westus2", "westus3", "centralus", "northcentralus", "southcentralus", "westcentralus"],
        default: "eastus2"
      },
      {
        name: "sku_name",
        label: "Workspace SKU",
        type: "select",
        required: false,
        options: ["Basic", "Enterprise"],
        default: "Basic",
        helpText: "Basic is sufficient for most workloads. Enterprise adds advanced features."
      },
      {
        name: "compute_cluster_vm_size",
        label: "Compute VM Size",
        type: "select",
        required: false,
        options: ["Standard_DS2_v2", "Standard_DS3_v2", "Standard_DS4_v2", "Standard_NC6", "Standard_NC12"],
        default: "Standard_DS2_v2",
        helpText: "DS series for general compute, NC series for GPU workloads"
      },
      {
        name: "compute_cluster_min_nodes",
        label: "Min Compute Nodes",
        type: "select",
        required: false,
        options: ["0", "1", "2"],
        default: "0",
        helpText: "Set to 0 to scale down when not in use (saves costs)"
      },
      {
        name: "compute_cluster_max_nodes",
        label: "Max Compute Nodes",
        type: "select",
        required: false,
        options: ["1", "2", "4", "8"],
        default: "2"
      },
      {
        name: "compute_cluster_priority",
        label: "Compute Priority",
        type: "select",
        required: false,
        options: ["LowPriority", "Dedicated"],
        default: "LowPriority",
        helpText: "Low Priority = 60-80% cheaper, but can be preempted. Use Dedicated for production."
      },
      {
        name: "storage_account_tier",
        label: "Storage Tier",
        type: "select",
        required: false,
        options: ["Standard", "Premium"],
        default: "Standard"
      },
      {
        name: "storage_account_replication",
        label: "Storage Replication",
        type: "select",
        required: false,
        options: ["LRS", "GRS", "RAGRS", "ZRS"],
        default: "LRS",
        helpText: "LRS is cheapest. Use GRS/ZRS for production data redundancy."
      }
    ],
    outputs: [
      {
        name: "workspace_name",
        description: "Azure ML Workspace name"
      },
      {
        name: "workspace_url",
        description: "Azure ML Studio URL"
      },
      {
        name: "storage_account_name",
        description: "Storage account for ML data"
      },
      {
        name: "container_registry_login_server",
        description: "Container registry for ML models"
      },
      {
        name: "compute_cluster_name",
        description: "Training compute cluster name"
      },
      {
        name: "key_vault_name",
        description: "Key Vault for secrets"
      }
    ],
    estimatedMonthlyCost: 15,
    costDetails: {
      description: "Cost depends on compute usage. Workspace itself is free.",
      workspace: "Free (no monthly charge for workspace)",
      storage: "~$2/month for 10GB Standard LRS",
      compute: "DS2_v2: ~$0.17/hr. With min=0, only pay when running jobs.",
      lowPriority: "Low Priority VMs are 60-80% cheaper than Dedicated",
      keyVault: "~$0.03/month",
      containerRegistry: "Basic SKU: ~$5/month",
      appInsights: "Free tier up to 5GB/month"
    }
  },
  // ============================================================
  // CROSSPLANE BUILDING BLOCKS
  // ============================================================
  // Architecture: User picks components, UI generates multiple claims
  // Each claim deploys to the target namespace
  {
    id: "xp-building-blocks",
    version: "2.0.0",
    displayName: "Application Stack",
    description: "Deploy a complete application with optional database, cache, and messaging services. All components are managed and connected automatically.",
    category: "Compute",
    provider: "crossplane",
    // Building blocks mode - generates multiple claims
    crossplane: {
      mode: "building-blocks",
      apiVersion: "platform.chrishouse.io/v1alpha1"
    },
    variables: [
      // === Core Settings ===
      {
        name: "appName",
        label: "Application Name",
        type: "string",
        required: true,
        placeholder: "myapp",
        section: "Core",
        validation: {
          pattern: "^[a-z][a-z0-9-]{1,20}$",
          message: "Lowercase letters, numbers, hyphens. 2-21 chars. Must start with letter."
        }
      },
      {
        name: "environment",
        label: "Environment",
        type: "select",
        required: true,
        options: ["dev", "staging", "prod"],
        default: "dev",
        section: "Core"
      },
      // === Database (PostgreSQL) ===
      {
        name: "postgres_enabled",
        label: "PostgreSQL Database",
        type: "checkbox",
        required: false,
        default: false,
        section: "Database",
        helpText: "Add a PostgreSQL database with persistent storage"
      },
      {
        name: "postgres_storageGB",
        label: "Storage (GB)",
        type: "select",
        required: false,
        options: ["10", "20", "50", "100"],
        default: "10",
        section: "Database",
        dependsOn: "postgres_enabled",
        showWhen: true
      },
      {
        name: "postgres_version",
        label: "PostgreSQL Version",
        type: "select",
        required: false,
        options: ["14", "15", "16"],
        default: "16",
        section: "Database",
        dependsOn: "postgres_enabled",
        showWhen: true
      },
      // === Cache (Redis) ===
      {
        name: "redis_enabled",
        label: "Redis Cache",
        type: "checkbox",
        required: false,
        default: false,
        section: "Cache",
        helpText: "Add a Redis instance for caching and session storage"
      },
      {
        name: "redis_version",
        label: "Redis Version",
        type: "select",
        required: false,
        options: ["7.2", "7.0", "6.2"],
        default: "7.2",
        section: "Cache",
        dependsOn: "redis_enabled",
        showWhen: true
      },
      {
        name: "redis_memoryLimitMB",
        label: "Memory Limit (MB)",
        type: "select",
        required: false,
        options: ["128", "256", "512", "1024"],
        default: "256",
        section: "Cache",
        dependsOn: "redis_enabled",
        showWhen: true
      },
      // === Message Queue (RabbitMQ) ===
      {
        name: "rabbitmq_enabled",
        label: "RabbitMQ Message Queue",
        type: "checkbox",
        required: false,
        default: false,
        section: "Messaging",
        helpText: "Add RabbitMQ for async messaging and task queues"
      },
      {
        name: "rabbitmq_version",
        label: "RabbitMQ Version",
        type: "select",
        required: false,
        options: ["3.13", "3.12"],
        default: "3.13",
        section: "Messaging",
        dependsOn: "rabbitmq_enabled",
        showWhen: true
      },
      {
        name: "rabbitmq_memoryLimitMB",
        label: "Memory Limit (MB)",
        type: "select",
        required: false,
        options: ["256", "512", "1024", "2048"],
        default: "512",
        section: "Messaging",
        dependsOn: "rabbitmq_enabled",
        showWhen: true
      },
      {
        name: "rabbitmq_exposeManagement",
        label: "Expose Management UI",
        type: "checkbox",
        required: false,
        default: false,
        section: "Messaging",
        dependsOn: "rabbitmq_enabled",
        showWhen: true,
        helpText: "Create ingress for RabbitMQ management UI"
      },
      {
        name: "rabbitmq_managementHost",
        label: "Management UI Hostname",
        type: "text",
        required: false,
        section: "Messaging",
        dependsOn: "rabbitmq_exposeManagement",
        showWhen: true,
        placeholder: "rabbitmq-myapp.example.com",
        helpText: "External hostname for RabbitMQ management UI (e.g., rabbitmq-myapp.chrishouse.io)"
      },
      // === Backend Service ===
      {
        name: "backend_enabled",
        label: "Backend Service",
        type: "checkbox",
        required: false,
        default: false,
        section: "Backend",
        helpText: "Add a backend API service"
      },
      {
        name: "backend_image",
        label: "Container Image",
        type: "acr-image",
        required: false,
        placeholder: "myregistry/backend:latest",
        section: "Backend",
        dependsOn: "backend_enabled",
        showWhen: true
      },
      {
        name: "backend_replicas",
        label: "Replicas",
        type: "select",
        required: false,
        options: ["1", "2", "3", "4", "5"],
        default: "2",
        section: "Backend",
        dependsOn: "backend_enabled",
        showWhen: true
      },
      {
        name: "backend_port",
        label: "Container Port",
        type: "string",
        required: false,
        default: "4000",
        section: "Backend",
        dependsOn: "backend_enabled",
        showWhen: true
      },
      {
        name: "backend_connectToDb",
        label: "Connect to Database",
        type: "checkbox",
        required: false,
        default: true,
        section: "Backend",
        dependsOn: "backend_enabled",
        showWhen: true,
        helpText: "Inject database credentials into backend (requires PostgreSQL)"
      },
      // === Frontend Service ===
      {
        name: "frontend_enabled",
        label: "Frontend Service",
        type: "checkbox",
        required: false,
        default: false,
        section: "Frontend",
        helpText: "Add a frontend web UI service"
      },
      {
        name: "frontend_image",
        label: "Container Image",
        type: "acr-image",
        required: false,
        placeholder: "myregistry/frontend:latest",
        section: "Frontend",
        dependsOn: "frontend_enabled",
        showWhen: true
      },
      {
        name: "frontend_replicas",
        label: "Replicas",
        type: "select",
        required: false,
        options: ["1", "2", "3", "4", "5"],
        default: "2",
        section: "Frontend",
        dependsOn: "frontend_enabled",
        showWhen: true
      },
      // === Ingress ===
      {
        name: "ingress_enabled",
        label: "Ingress (External Access)",
        type: "checkbox",
        required: false,
        default: false,
        section: "Ingress",
        helpText: "Create ingress for external traffic with TLS"
      },
      {
        name: "ingress_host",
        label: "Hostname",
        type: "string",
        required: false,
        placeholder: "myapp.example.com",
        section: "Ingress",
        dependsOn: "ingress_enabled",
        showWhen: true
      },
      {
        name: "ingress_clusterIssuer",
        label: "Cert-Manager Issuer",
        type: "string",
        required: false,
        default: "letsencrypt-prod",
        section: "Ingress",
        dependsOn: "ingress_enabled",
        showWhen: true
      }
    ],
    outputs: [
      { name: "namespace", description: "Created namespace name" },
      { name: "postgresSecret", description: "PostgreSQL credentials secret (if enabled)" },
      { name: "redisSecret", description: "Redis credentials secret (if enabled)" },
      { name: "rabbitmqSecret", description: "RabbitMQ credentials secret (if enabled)" },
      { name: "ingressHost", description: "Ingress hostname (if enabled)" }
    ],
    estimatedMonthlyCost: 0,
    costDetails: {
      description: "Cost depends on selected components. Base Kubernetes resources only.",
      isDynamic: true,
      componentCosts: {
        postgres: { base: 5, perGB: 0.10, description: "PostgreSQL with persistent storage" },
        redis: { base: 2, perMB: 0.005, description: "Redis cache instance" },
        rabbitmq: { base: 3, perMB: 0.003, description: "RabbitMQ message broker" },
        backend: { base: 5, perReplica: 2, description: "Backend service pods" },
        frontend: { base: 3, perReplica: 1.5, description: "Frontend service pods" },
        ingress: { base: 1, description: "Ingress with TLS certificate" }
      }
    }
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
