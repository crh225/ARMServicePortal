module "azure-storage-basic-e048de74" {
  source              = "../../modules/azure-storage-basic"
  project_name        = "testsa12925"
  environment         = "dev"
  resource_group_name = "120420252-dev-rg"
  location            = "eastus2"
  account_tier        = "Premium"
  replication_type    = "LRS"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-storage-basic"
    armportal-request-id  = "257"
  }
}

output "azure-storage-basic-e048de74_storage_account_name" {
  value       = module.azure-storage-basic-e048de74.storage_account_name
  description = "The name of the created storage account"
}
output "azure-storage-basic-e048de74_primary_blob_endpoint" {
  value       = module.azure-storage-basic-e048de74.primary_blob_endpoint
  description = "The endpoint URL for blob storage"
}