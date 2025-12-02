module "azure-cdn-9b43c2f4" {
  source       = "../../modules/azure-cdn"
  project_name = "testcdn"
  environment = "dev"
  resource_group_name = "rg-testpr3-dev-rg"
  origin_hostname = "test112351devgvmc.z20.web.core.windows.net "
  custom_domain = ""
  sku = "Standard_Microsoft"
  optimization_type = "GeneralWebDelivery"
  enable_https = "true"
  enable_compression = "true"
  query_string_caching = "IgnoreQueryString"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-cdn"
    armportal-request-id  = "azure-cdn-9b43c2f4"
  }
}

output "azure-cdn-9b43c2f4_cdn_endpoint_hostname" {
  value       = module.azure-cdn-9b43c2f4.cdn_endpoint_hostname
  description = "CDN endpoint hostname (*.azureedge.net)"
}
output "azure-cdn-9b43c2f4_cdn_endpoint_url" {
  value       = module.azure-cdn-9b43c2f4.cdn_endpoint_url
  description = "CDN endpoint URL"
}
output "azure-cdn-9b43c2f4_custom_domain_url" {
  value       = module.azure-cdn-9b43c2f4.custom_domain_url
  description = "Custom domain URL (if configured)"
}
output "azure-cdn-9b43c2f4_dns_cname_target" {
  value       = module.azure-cdn-9b43c2f4.dns_cname_target
  description = "DNS CNAME target - point your custom domain to this"
}