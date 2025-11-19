module "azure-static-site_c209f0f7" {
  source       = "../../modules/azure-static-site"
  project_name = "test11192025-1"
  environment = "dev"
  resource_group_name = "rg-testpr2-dev-rg"
  location = "eastus2"
  index_document = "index.html"
  error_document = "404.html"
  enable_cdn = "false"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-static-site"
    armportal-request-id  = "azure-static-site_c209f0f7"
  }
}

output "azure-static-site_c209f0f7_primary_web_endpoint" {
  value       = module.azure-static-site_c209f0f7.primary_web_endpoint
  description = "Primary website URL"
}
output "azure-static-site_c209f0f7_storage_account_name" {
  value       = module.azure-static-site_c209f0f7.storage_account_name
  description = "Storage account name"
}
output "azure-static-site_c209f0f7_resource_group_name" {
  value       = module.azure-static-site_c209f0f7.resource_group_name
  description = "Resource group name"
}
output "azure-static-site_c209f0f7_cdn_endpoint" {
  value       = module.azure-static-site_c209f0f7.cdn_endpoint
  description = "CDN endpoint URL (if CDN enabled)"
}