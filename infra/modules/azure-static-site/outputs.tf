output "storage_account_name" {
  value       = azurerm_storage_account.this.name
  description = "The name of the created storage account"
}

output "resource_group_name" {
  value       = var.resource_group_name
  description = "The name of the resource group"
}

output "primary_web_endpoint" {
  value       = azurerm_storage_account.this.primary_web_endpoint
  description = "The primary static website endpoint"
}

output "cdn_endpoint" {
  value       = local.enable_cdn_bool ? azurerm_cdn_endpoint.this[0].fqdn : ""
  description = "The CDN endpoint FQDN (if CDN is enabled)"
}
