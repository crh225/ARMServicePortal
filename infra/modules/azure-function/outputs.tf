output "function_app_name" {
  description = "Name of the Function App"
  value       = var.os_type == "Linux" ? azurerm_linux_function_app.function_app[0].name : azurerm_windows_function_app.function_app[0].name
}

output "function_app_id" {
  description = "ID of the Function App"
  value       = var.os_type == "Linux" ? azurerm_linux_function_app.function_app[0].id : azurerm_windows_function_app.function_app[0].id
}

output "default_hostname" {
  description = "Default hostname of the Function App"
  value       = var.os_type == "Linux" ? azurerm_linux_function_app.function_app[0].default_hostname : azurerm_windows_function_app.function_app[0].default_hostname
}

output "function_app_url" {
  description = "URL to access the Function App"
  value       = var.os_type == "Linux" ? "https://${azurerm_linux_function_app.function_app[0].default_hostname}" : "https://${azurerm_windows_function_app.function_app[0].default_hostname}"
}

output "storage_account_name" {
  description = "Storage account name used by the Function App"
  value       = azurerm_storage_account.function_storage.name
}

output "app_service_plan_name" {
  description = "Name of the App Service Plan"
  value       = azurerm_service_plan.function_plan.name
}

output "application_insights_name" {
  description = "Name of the Application Insights instance"
  value       = azurerm_application_insights.function_insights.name
}

output "application_insights_instrumentation_key" {
  description = "Instrumentation key for Application Insights"
  value       = azurerm_application_insights.function_insights.instrumentation_key
  sensitive   = true
}

output "resource_group_name" {
  description = "Resource group containing the Function App"
  value       = var.resource_group_name
}
