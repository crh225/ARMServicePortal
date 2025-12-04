module "azure-storage-basic-1a2e5b2e" {
  source       = "../../modules/azure-storage-basic"
  project_name = "120325"
  environment = "dev"
  resource_group_name = "112925-dev-rg"
  location = "eastus2"
  account_tier = "Standard"
  replication_type = "LRS"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-storage-basic"
    armportal-request-id  = "azure-storage-basic-1a2e5b2e"
  }
}

output "azure-storage-basic-1a2e5b2e_storage_account_name" {
  value       = module.azure-storage-basic-1a2e5b2e.storage_account_name
  description = "The name of the created storage account"
}
output "azure-storage-basic-1a2e5b2e_primary_blob_endpoint" {
  value       = module.azure-storage-basic-1a2e5b2e.primary_blob_endpoint
  description = "The endpoint URL for blob storage"
}