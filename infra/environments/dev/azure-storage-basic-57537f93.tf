module "azure-storage-basic-57537f93" {
  source       = "../../modules/azure-storage-basic"
  project_name = "testzz"
  environment = "dev"
  resource_group_name = "test"
  location = "eastus2"
  account_tier = "Standard"
  replication_type = "LRS"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-storage-basic"
    armportal-request-id  = "240"
  }
}

output "azure-storage-basic-57537f93_storage_account_name" {
  value       = module.azure-storage-basic-57537f93.storage_account_name
  description = "The name of the created storage account"
}
output "azure-storage-basic-57537f93_primary_blob_endpoint" {
  value       = module.azure-storage-basic-57537f93.primary_blob_endpoint
  description = "The endpoint URL for blob storage"
}