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
