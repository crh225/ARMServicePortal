output "elastic_deployment_id" {
  description = "ID of the Elastic deployment"
  value       = azurerm_elastic_cloud_elasticsearch.main.id
}

output "elastic_deployment_name" {
  description = "Name of the Elastic deployment"
  value       = azurerm_elastic_cloud_elasticsearch.main.name
}

output "elasticsearch_endpoint" {
  description = "Elasticsearch endpoint URL"
  value       = azurerm_elastic_cloud_elasticsearch.main.elasticsearch_service_url
}

output "kibana_endpoint" {
  description = "Kibana endpoint URL"
  value       = azurerm_elastic_cloud_elasticsearch.main.kibana_service_url
}

output "elastic_cloud_deployment_id" {
  description = "Elastic Cloud deployment ID"
  value       = azurerm_elastic_cloud_elasticsearch.main.elastic_cloud_deployment_id
}
