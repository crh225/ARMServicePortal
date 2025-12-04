module "azure-static-site-568bac97" {
  source       = "../../modules/azure-static-site"
  project_name = "12325"
  environment = "dev"
  resource_group_name = "12032025-dev-rg"
  location = "eastus2"
  index_document = "index.html"
  error_document = "404.html"
  enable_cdn = "false"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-static-site"
    armportal-request-id  = "azure-static-site-568bac97"
  }
}

output "azure-static-site-568bac97_primary_web_endpoint" {
  value       = module.azure-static-site-568bac97.primary_web_endpoint
  description = "Primary website URL"
}
output "azure-static-site-568bac97_storage_account_name" {
  value       = module.azure-static-site-568bac97.storage_account_name
  description = "Storage account name"
}
output "azure-static-site-568bac97_resource_group_name" {
  value       = module.azure-static-site-568bac97.resource_group_name
  description = "Resource group name"
}
output "azure-static-site-568bac97_cdn_endpoint" {
  value       = module.azure-static-site-568bac97.cdn_endpoint
  description = "CDN endpoint URL (if CDN enabled)"
}