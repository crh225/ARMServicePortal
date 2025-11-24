module "azure-storage-basic_1500036d" {
  source       = "../../modules/azure-storage-basic"
  project_name = "112525-asa-basic"
  environment = "dev"
  resource_group_name = "test9991-dev-rg"
  location = "eastus"
  account_tier = "Standard"
  replication_type = "LRS"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-storage-basic"
    armportal-request-id  = "129"
  }
}

output "azure-storage-basic_1500036d_storage_account_name" {
  value       = module.azure-storage-basic_1500036d.storage_account_name
  description = "The name of the created storage account"
}
output "azure-storage-basic_1500036d_primary_blob_endpoint" {
  value       = module.azure-storage-basic_1500036d.primary_blob_endpoint
  description = "The endpoint URL for blob storage"
}