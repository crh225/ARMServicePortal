output "workspace_name" {
  description = "Azure ML Workspace name"
  value       = azurerm_machine_learning_workspace.ml_workspace.name
}

output "workspace_id" {
  description = "Azure ML Workspace ID"
  value       = azurerm_machine_learning_workspace.ml_workspace.id
}

output "workspace_url" {
  description = "Azure ML Studio URL"
  value       = "https://ml.azure.com/home?wsid=${azurerm_machine_learning_workspace.ml_workspace.id}"
}

output "storage_account_name" {
  description = "Storage account name for ML data"
  value       = azurerm_storage_account.ml_storage.name
}

output "storage_account_connection_string" {
  description = "Storage account connection string"
  value       = azurerm_storage_account.ml_storage.primary_connection_string
  sensitive   = true
}

output "container_registry_login_server" {
  description = "Container registry login server"
  value       = azurerm_container_registry.ml_acr.login_server
}

output "container_registry_admin_username" {
  description = "Container registry admin username"
  value       = azurerm_container_registry.ml_acr.admin_username
}

output "container_registry_admin_password" {
  description = "Container registry admin password"
  value       = azurerm_container_registry.ml_acr.admin_password
  sensitive   = true
}

output "application_insights_connection_string" {
  description = "Application Insights connection string"
  value       = azurerm_application_insights.ml_insights.connection_string
  sensitive   = true
}

output "compute_cluster_name" {
  description = "Training compute cluster name (empty if not created)"
  value       = var.create_compute_cluster ? azurerm_machine_learning_compute_cluster.training_cluster[0].name : ""
}

output "key_vault_name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.ml_keyvault.name
}
