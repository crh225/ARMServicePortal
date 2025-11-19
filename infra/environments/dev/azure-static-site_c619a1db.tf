module "azure-static-site_c619a1db" {
  source       = "../../modules/azure-static-site"
  project_name = "test"
  environment = "dev"
  resource_group_name = "test"
  location = "eastus2"
  index_document = "index.html"
  error_document = "404.html"
  enable_cdn = "false"
}

output "azure-static-site_c619a1db_primary_web_endpoint" {
  value       = module.azure-static-site_c619a1db.primary_web_endpoint
  description = "Primary website URL"
}
output "azure-static-site_c619a1db_storage_account_name" {
  value       = module.azure-static-site_c619a1db.storage_account_name
  description = "Storage account name"
}
output "azure-static-site_c619a1db_resource_group_name" {
  value       = module.azure-static-site_c619a1db.resource_group_name
  description = "Resource group name"
}
output "azure-static-site_c619a1db_cdn_endpoint" {
  value       = module.azure-static-site_c619a1db.cdn_endpoint
  description = "CDN endpoint URL (if CDN enabled)"
}