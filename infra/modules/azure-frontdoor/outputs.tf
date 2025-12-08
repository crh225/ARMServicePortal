output "frontdoor_endpoint_hostname" {
  value       = azurerm_cdn_frontdoor_endpoint.this.host_name
  description = "Front Door endpoint hostname"
}

output "frontdoor_profile_id" {
  value       = azurerm_cdn_frontdoor_profile.this.id
  description = "Front Door profile ID"
}

output "custom_domain_validation_token" {
  value       = var.custom_domain != null ? azurerm_cdn_frontdoor_custom_domain.this[0].validation_token : null
  description = "Validation token for custom domain (add as TXT record)"
}

output "custom_domain_name" {
  value       = var.custom_domain
  description = "Custom domain name"
}
