module "azure-frontdoor_8e5d7a09" {
  source       = "../../modules/azure-frontdoor"
  project_name = "portal-static-site"
  environment = "dev"
  resource_group_name = "rg-testpr3-dev-rg"
  origin_hostname = "armportalfec4ji.z20.web.core.windows.net"
  custom_domain = "portal.chrishouse.io"
  sku_name = "Standard_AzureFrontDoor"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-frontdoor"
    armportal-request-id  = "108"
  }
}

output "azure-frontdoor_8e5d7a09_frontdoor_endpoint_hostname" {
  value       = module.azure-frontdoor_8e5d7a09.frontdoor_endpoint_hostname
  description = "Front Door endpoint hostname"
}
output "azure-frontdoor_8e5d7a09_custom_domain_validation_token" {
  value       = module.azure-frontdoor_8e5d7a09.custom_domain_validation_token
  description = "Validation token for custom domain (add as TXT record: _dnsauth.yourdomain.com)"
}
output "azure-frontdoor_8e5d7a09_custom_domain_name" {
  value       = module.azure-frontdoor_8e5d7a09.custom_domain_name
  description = "Custom domain name"
}