module "azure-storage-basic_fad68ef4" {
  source       = "../../modules/azure-storage-basic"
  project_name = "test"
  environment = "dev"
  resource_group_name = "test"
  location = "eastus2"
  account_tier = "Standard"
  replication_type = "LRS"
}