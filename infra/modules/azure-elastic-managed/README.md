# Azure Elastic Managed Service Module

This module deploys a fully managed Elasticsearch cluster using Azure Elastic (by Elastic).

## Features

- Fully managed Elasticsearch, Kibana, and Logstash
- Automatic updates and security patches
- Built-in high availability
- Integrated monitoring
- No container configuration headaches

## Usage

```hcl
module "elastic" {
  source = "../../modules/azure-elastic-managed"

  project_name        = "myproject"
  environment         = "dev"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  elastic_email       = "admin@example.com"

  tags = {
    ManagedBy = "Terraform"
  }
}
```

## Outputs

- `elasticsearch_endpoint` - Elasticsearch API endpoint
- `kibana_endpoint` - Kibana UI endpoint
- `elastic_deployment_id` - Azure resource ID

## Requirements

- Azure subscription with Elastic marketplace offering enabled
- Valid email address for Elastic Cloud account

## Cost

The managed service has a pay-as-you-go pricing model based on usage.
Default SKU is `ess-consumption-2024_Monthly` (consumption-based pricing).
