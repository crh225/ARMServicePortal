module "azure-storage-basic_c8020765" {
  source       = "../../modules/azure-storage-basic"
  project_name = "test9991"
  environment = "dev"
  resource_group_name = "test9991-dev-rg"
  location = "eastus2"
  account_tier = "Standard"
  replication_type = "LRS"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-storage-basic"
    armportal-request-id  = "azure-storage-basic_c8020765"
  }
}

output "azure-storage-basic_c8020765_storage_account_name" {
  value       = module.azure-storage-basic_c8020765.storage_account_name
  description = "The name of the created storage account"
}
output "azure-storage-basic_c8020765_primary_blob_endpoint" {
  value       = module.azure-storage-basic_c8020765.primary_blob_endpoint
  description = "The endpoint URL for blob storage"
}