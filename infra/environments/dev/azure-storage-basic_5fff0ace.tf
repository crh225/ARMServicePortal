module "azure-storage-basic_5fff0ace" {
  source       = "../../modules/azure-storage-basic"
  project_name = "asa-test2"
  environment = "dev"
  resource_group_name = "test"
  location = "eastus2"
  account_tier = "Standard"
  replication_type = "LRS"
}