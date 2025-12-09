module "azure-storage-basic_84c4b409" {
  source              = "../../modules/azure-storage-basic"
  project_name        = "test-st-1120252-1"
  environment         = "dev"
  resource_group_name = "rg-testpr2-dev-rg"
  location            = "eastus2"
  account_tier        = "Standard"
  replication_type    = "LRS"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-storage-basic"
    armportal-request-id  = "86"
  }
}

output "azure-storage-basic_84c4b409_storage_account_name" {
  value       = module.azure-storage-basic_84c4b409.storage_account_name
  description = "The name of the created storage account"
}
output "azure-storage-basic_84c4b409_primary_blob_endpoint" {
  value       = module.azure-storage-basic_84c4b409.primary_blob_endpoint
  description = "The endpoint URL for blob storage"
}