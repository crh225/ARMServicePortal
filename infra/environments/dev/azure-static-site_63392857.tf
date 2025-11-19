module "azure-static-site_63392857" {
  source       = "../../modules/azure-static-site"
  project_name = "test-111925-2"
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
    armportal-request-id  = "azure-static-site_63392857"
  }
}

output "azure-static-site_63392857_primary_web_endpoint" {
  value       = module.azure-static-site_63392857.primary_web_endpoint
  description = "Primary website URL"
}
output "azure-static-site_63392857_storage_account_name" {
  value       = module.azure-static-site_63392857.storage_account_name
  description = "Storage account name"
}
output "azure-static-site_63392857_resource_group_name" {
  value       = module.azure-static-site_63392857.resource_group_name
  description = "Resource group name"
}
output "azure-static-site_63392857_cdn_endpoint" {
  value       = module.azure-static-site_63392857.cdn_endpoint
  description = "CDN endpoint URL (if CDN enabled)"
}