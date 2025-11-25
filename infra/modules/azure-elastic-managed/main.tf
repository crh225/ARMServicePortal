/**
 * Azure Elastic Managed Service Blueprint
 * Deploys a fully managed Elasticsearch cluster via Azure Marketplace
 * Includes Elasticsearch, Kibana, and Logstash with automatic updates and security
 */

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

locals {
  common_tags = merge(var.tags, {
    "component" = "elastic-managed"
  })
}

# Azure Elastic Cloud deployment
resource "azurerm_elastic_cloud_elasticsearch" "main" {
  name                = "es-${var.project_name}-${var.environment}"
  resource_group_name = var.resource_group_name
  location            = var.location

  sku_name = var.sku_name

  elastic_cloud_email_address = var.elastic_email

  # Monitoring configuration
  monitoring_enabled = var.monitoring_enabled

  tags = local.common_tags
}
