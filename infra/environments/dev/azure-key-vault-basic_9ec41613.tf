module "azure-key-vault-basic_9ec41613" {
  source       = "../../modules/azure-key-vault-basic"
  project_name = "akv-test1"
  environment = "dev"
  resource_group_name = "test"
  location = "eastus2"
  sku_name = "standard"
  soft_delete_retention_days = "7"
  purge_protection_enabled = "true"
}