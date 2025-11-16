module "azure-storage-basic_eb923f4a" {
  source       = "../../modules/azure-storage-basic"
  project_name = "asa-test2"
  environment = "dev"
  resource_group_name = "test-dev-rg"
  location = "eastus2"
  account_tier = "Standard"
  replication_type = "LRS"
}