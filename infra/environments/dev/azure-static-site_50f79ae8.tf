module "azure-static-site_50f79ae8" {
  source       = "../../infra/modules/azure-static-site"
  project_name = "teststaticsite"
  environment = "dev"
  resource_group_name = "rg-armportal-tfstate-dev"
  location = "eastus2"
  index_document = "index.html"
  error_document = "404.html"
  enable_cdn = "false"
}

output "azure-static-site_50f79ae8_primary_web_endpoint" {
  value       = module.azure-static-site_50f79ae8.primary_web_endpoint
  description = "Primary website URL"
}
output "azure-static-site_50f79ae8_storage_account_name" {
  value       = module.azure-static-site_50f79ae8.storage_account_name
  description = "Storage account name"
}
output "azure-static-site_50f79ae8_resource_group_name" {
  value       = module.azure-static-site_50f79ae8.resource_group_name
  description = "Resource group name"
}
output "azure-static-site_50f79ae8_cdn_endpoint" {
  value       = module.azure-static-site_50f79ae8.cdn_endpoint
  description = "CDN endpoint URL (if CDN enabled)"
}