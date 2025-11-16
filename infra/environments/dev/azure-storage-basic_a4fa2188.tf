module "azure-storage-basic_a4fa2188" {
  source       = "../../modules/azure-storage-basic"
  project_name = "asa-test1"
  environment = "dev"
  resource_group_name = "test"
  location = "eastus2"
  account_tier = "Standard"
  replication_type = "LRS"
}