module "azure-storage-basic_daee18a2" {
  source       = "../../modules/azure-storage-basic"
  project_name = ""
  environment = "dev"
  resource_group_name = ""
  location = "eastus2"
  account_tier = "Standard"
  replication_type = "LRS"
}