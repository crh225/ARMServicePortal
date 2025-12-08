# =============================================================================
# OUTPUTS
# =============================================================================

output "cdn_profile_name" {
  value       = azurerm_cdn_profile.this.name
  description = "CDN profile name"
}

output "cdn_endpoint_hostname" {
  value       = azurerm_cdn_endpoint.this.fqdn
  description = "CDN endpoint hostname (*.azureedge.net)"
}

output "cdn_endpoint_url" {
  value       = "https://${azurerm_cdn_endpoint.this.fqdn}"
  description = "CDN endpoint URL"
}

output "custom_domain_hostname" {
  value       = var.custom_domain
  description = "Custom domain hostname (if configured)"
}

output "custom_domain_url" {
  value       = var.custom_domain != null ? "https://${var.custom_domain}" : null
  description = "Custom domain URL (if configured)"
}

output "origin_hostname" {
  value       = var.origin_hostname
  description = "Origin hostname"
}

output "dns_cname_target" {
  value       = azurerm_cdn_endpoint.this.fqdn
  description = "DNS CNAME target - point your custom domain to this value"
}

output "resource_group_name" {
  value       = var.resource_group_name
  description = "Resource group name"
}
