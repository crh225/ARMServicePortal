module "azure-function-4562d22f" {
  source       = "../../modules/azure-function"
  project_name = "fnnotification"
  environment = "dev"
  resource_group_name = "rg-testpr3-dev-rg"
  location = "eastus2"
  runtime_stack = "node"
  runtime_version = "20"
  os_type = "Linux"
  sku_name = "Y1"
  always_on = "false"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-function"
    armportal-request-id  = "azure-function-4562d22f"
  }
}

output "azure-function-4562d22f_function_app_name" {
  value       = module.azure-function-4562d22f.function_app_name
  description = "Name of the Function App"
}
output "azure-function-4562d22f_function_app_url" {
  value       = module.azure-function-4562d22f.function_app_url
  description = "URL to access the Function App"
}
output "azure-function-4562d22f_default_hostname" {
  value       = module.azure-function-4562d22f.default_hostname
  description = "Default hostname of the Function App"
}
output "azure-function-4562d22f_storage_account_name" {
  value       = module.azure-function-4562d22f.storage_account_name
  description = "Storage account used by the Function App"
}
output "azure-function-4562d22f_app_service_plan_name" {
  value       = module.azure-function-4562d22f.app_service_plan_name
  description = "App Service Plan name"
}
output "azure-function-4562d22f_application_insights_name" {
  value       = module.azure-function-4562d22f.application_insights_name
  description = "Application Insights instance name"
}
output "azure-function-4562d22f_resource_group_name" {
  value       = module.azure-function-4562d22f.resource_group_name
  description = "Resource group containing the Function App"
}