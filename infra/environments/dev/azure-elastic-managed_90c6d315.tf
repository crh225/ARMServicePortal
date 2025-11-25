module "azure-elastic-managed_90c6d315" {
  source       = "../../modules/azure-elastic-managed"
  project_name = "test-az-elk-managed"
  environment = "dev"
  resource_group_name = "test3-dev-rg"
  location = "eastus2"
  elastic_email = "926068@gmail.com"
  sku_name = "ess-consumption-2024_Monthly"
  monitoring_enabled = "true"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-elastic-managed"
    armportal-request-id  = "155"
  }
}

output "azure-elastic-managed_90c6d315_elasticsearch_endpoint" {
  value       = module.azure-elastic-managed_90c6d315.elasticsearch_endpoint
  description = "Elasticsearch API endpoint for data ingestion and queries"
}
output "azure-elastic-managed_90c6d315_kibana_endpoint" {
  value       = module.azure-elastic-managed_90c6d315.kibana_endpoint
  description = "Kibana web interface for visualization and management"
}
output "azure-elastic-managed_90c6d315_elastic_deployment_id" {
  value       = module.azure-elastic-managed_90c6d315.elastic_deployment_id
  description = "Azure resource ID of the Elastic deployment"
}
output "azure-elastic-managed_90c6d315_elastic_cloud_deployment_id" {
  value       = module.azure-elastic-managed_90c6d315.elastic_cloud_deployment_id
  description = "Elastic Cloud deployment identifier"
}