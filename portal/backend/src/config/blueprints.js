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
    version: "1.0.0",
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
  // ============================================================
  // CROSSPLANE BLUEPRINTS
  // ============================================================
  {
    id: "xp-application-environment",
    version: "1.0.0",
    displayName: "Application Environment (Full Stack)",
    description: "Complete application stack with frontend, backend, and PostgreSQL database. Provisions namespace, deployments, services, and ingress with TLS.",
    category: "Compute",
    provider: "crossplane",
    // Crossplane-specific config
    crossplane: {
      apiVersion: "platform.chrishouse.io/v1alpha1",
      kind: "ApplicationEnvironmentClaim",
      compositionRef: "application-environment",
      claimsNamespace: "platform-claims"
    },
    variables: [
      {
        name: "appName",
        label: "Application Name",
        type: "string",
        required: true,
        placeholder: "orders",
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
        default: "dev"
      },
      {
        name: "frontend_imageRepo",
        label: "Frontend Image Repository",
        type: "acr-repository",
        required: true,
        placeholder: "Select from registry or enter custom",
        helpText: "Select an image from your ACR or enter a full image path"
      },
      {
        name: "frontend_tag",
        label: "Frontend Image Tag",
        type: "acr-tag",
        dependsOn: "frontend_imageRepo",
        required: true,
        default: "latest"
      },
      {
        name: "frontend_replicas",
        label: "Frontend Replicas",
        type: "select",
        required: false,
        options: ["1", "2", "3", "4", "5"],
        default: "2"
      },
      {
        name: "frontend_port",
        label: "Frontend Container Port",
        type: "string",
        required: false,
        default: "80"
      },
      {
        name: "backend_imageRepo",
        label: "Backend Image Repository",
        type: "acr-repository",
        required: true,
        placeholder: "Select from registry or enter custom",
        helpText: "Select an image from your ACR or enter a full image path"
      },
      {
        name: "backend_tag",
        label: "Backend Image Tag",
        type: "acr-tag",
        dependsOn: "backend_imageRepo",
        required: true,
        default: "latest"
      },
      {
        name: "backend_replicas",
        label: "Backend Replicas",
        type: "select",
        required: false,
        options: ["1", "2", "3", "4", "5"],
        default: "2"
      },
      {
        name: "backend_port",
        label: "Backend Container Port",
        type: "string",
        required: false,
        default: "4000"
      },
      {
        name: "database_storageGB",
        label: "Database Storage (GB)",
        type: "select",
        required: true,
        options: ["10", "20", "50", "100", "200", "500"],
        default: "10"
      },
      {
        name: "database_version",
        label: "PostgreSQL Version",
        type: "select",
        required: false,
        options: ["14", "15", "16"],
        default: "16"
      },
      {
        name: "ingress_host",
        label: "Ingress Hostname",
        type: "string",
        required: true,
        placeholder: "myapp-dev.example.com"
      },
      {
        name: "ingress_tlsEnabled",
        label: "Enable TLS (HTTPS)",
        type: "select",
        required: false,
        options: ["true", "false"],
        default: "true"
      },
      {
        name: "ingress_clusterIssuer",
        label: "Cert-Manager Cluster Issuer",
        type: "string",
        required: false,
        default: "letsencrypt-prod"
      }
    ],
    outputs: [
      {
        name: "namespaceRef",
        description: "Created namespace name"
      },
      {
        name: "frontendEndpoint",
        description: "Frontend URL (https://...)"
      },
      {
        name: "backendEndpoint",
        description: "Internal backend service endpoint"
      },
      {
        name: "databaseEndpoint",
        description: "PostgreSQL connection endpoint"
      }
    ],
    estimatedMonthlyCost: 80
  },
  {
    id: "xp-redis",
    version: "1.0.0",
    displayName: "Redis (Single Node)",
    description: "Single-node Redis instance with persistent storage. Perfect for caching, session storage, and pub/sub messaging in Kubernetes environments.",
    category: "Cache",
    provider: "crossplane",
    crossplane: {
      apiVersion: "platform.chrishouse.io/v1alpha1",
      kind: "RedisClaim",
      compositionRef: "redis",
      claimsNamespace: "platform-claims"
    },
    variables: [
      {
        name: "name",
        label: "Redis Instance Name",
        type: "string",
        required: true,
        placeholder: "myapp-cache",
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
        default: "dev"
      },
      {
        name: "storageGB",
        label: "Storage Size (GB)",
        type: "select",
        required: true,
        options: ["1", "2", "5", "10", "20"],
        default: "1"
      },
      {
        name: "redisVersion",
        label: "Redis Version",
        type: "select",
        required: false,
        options: ["7.2", "7.0", "6.2"],
        default: "7.2"
      },
      {
        name: "maxMemoryPolicy",
        label: "Max Memory Policy",
        type: "select",
        required: false,
        options: ["allkeys-lru", "volatile-lru", "allkeys-lfu", "volatile-lfu", "allkeys-random", "volatile-random", "noeviction"],
        default: "allkeys-lru",
        helpText: "Policy for evicting keys when max memory is reached"
      },
      {
        name: "memoryLimitMB",
        label: "Memory Limit (MB)",
        type: "select",
        required: false,
        options: ["128", "256", "512", "1024", "2048"],
        default: "256"
      }
    ],
    outputs: [
      {
        name: "endpoint",
        description: "Redis connection endpoint (host:port)"
      },
      {
        name: "serviceName",
        description: "Kubernetes service name"
      },
      {
        name: "namespace",
        description: "Kubernetes namespace"
      }
    ],
    estimatedMonthlyCost: 5
  },
  {
    id: "xp-rabbitmq",
    version: "1.0.0",
    displayName: "RabbitMQ (Single Node)",
    description: "Single-node RabbitMQ message broker with management UI. Ideal for async messaging, task queues, and event-driven architectures.",
    category: "Messaging",
    provider: "crossplane",
    crossplane: {
      apiVersion: "platform.chrishouse.io/v1alpha1",
      kind: "RabbitMQClaim",
      compositionRef: "rabbitmq",
      claimsNamespace: "platform-claims"
    },
    variables: [
      {
        name: "name",
        label: "RabbitMQ Instance Name",
        type: "string",
        required: true,
        placeholder: "myapp-mq",
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
        default: "dev"
      },
      {
        name: "storageGB",
        label: "Storage Size (GB)",
        type: "select",
        required: true,
        options: ["5", "10", "20", "50"],
        default: "5"
      },
      {
        name: "rabbitmqVersion",
        label: "RabbitMQ Version",
        type: "select",
        required: false,
        options: ["3.13", "3.12", "3.11"],
        default: "3.13"
      },
      {
        name: "memoryLimitMB",
        label: "Memory Limit (MB)",
        type: "select",
        required: false,
        options: ["256", "512", "1024", "2048", "4096"],
        default: "512"
      },
      {
        name: "adminUsername",
        label: "Admin Username",
        type: "string",
        required: false,
        default: "admin",
        helpText: "Username for RabbitMQ management UI"
      }
    ],
    outputs: [
      {
        name: "amqpEndpoint",
        description: "AMQP connection endpoint (host:port)"
      },
      {
        name: "managementUrl",
        description: "Management UI URL (https://...)"
      },
      {
        name: "serviceName",
        description: "Kubernetes service name"
      },
      {
        name: "namespace",
        description: "Kubernetes namespace"
      },
      {
        name: "adminPassword",
        description: "Admin password (from secret)",
        sensitive: true
      }
    ],
    estimatedMonthlyCost: 10
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
