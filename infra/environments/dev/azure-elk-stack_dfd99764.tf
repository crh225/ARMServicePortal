module "azure-elk-stack_dfd99764" {
  source       = "../../modules/azure-elk-stack"
  project_name = "elk-aci-test2"
  environment = "dev"
  resource_group_name = "test3-dev-rg"
  location = "eastus2"
  elk_version = "8.11.0"
  elasticsearch_cpu = "1"
  elasticsearch_memory = "2"
  elasticsearch_heap_size = "1g"
  logstash_cpu = "0.5"
  logstash_memory = "1"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-elk-stack"
    armportal-request-id  = "azure-elk-stack_dfd99764"
  }
}

output "azure-elk-stack_dfd99764_kibana_url" {
  value       = module.azure-elk-stack_dfd99764.kibana_url
  description = "URL to access Kibana dashboard"
}
output "azure-elk-stack_dfd99764_logstash_host" {
  value       = module.azure-elk-stack_dfd99764.logstash_host
  description = "Logstash host for Node.js applications"
}
output "azure-elk-stack_dfd99764_logstash_port" {
  value       = module.azure-elk-stack_dfd99764.logstash_port
  description = "Logstash port for Node.js applications (5044)"
}
output "azure-elk-stack_dfd99764_elasticsearch_password" {
  value       = module.azure-elk-stack_dfd99764.elasticsearch_password
  description = "Auto-generated Elasticsearch password (sensitive)"
  sensitive   = true
}