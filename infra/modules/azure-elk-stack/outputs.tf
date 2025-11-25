output "kibana_url" {
  description = "URL to access Kibana dashboard"
  value       = "http://${azurerm_container_group.elk.fqdn}:5601"
}

output "logstash_host" {
  description = "Logstash host for Node.js applications"
  value       = azurerm_container_group.elk.fqdn
}

output "logstash_port" {
  description = "Logstash port for Node.js applications"
  value       = 5044
}

output "elasticsearch_url" {
  description = "Elasticsearch URL"
  value       = "http://${azurerm_container_group.elk.fqdn}:9200"
  sensitive   = true
}

output "elasticsearch_password" {
  description = "Auto-generated Elasticsearch password for elastic user"
  value       = random_password.elasticsearch_password.result
  sensitive   = true
}

output "container_group_id" {
  description = "ID of the container group"
  value       = azurerm_container_group.elk.id
}

output "storage_account_name" {
  description = "Name of the storage account for ELK data"
  value       = azurerm_storage_account.elk.name
}
