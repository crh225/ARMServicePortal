module "azure-key-vault-basic_e10a89dc" {
  source       = "../../modules/azure-key-vault-basic"
  project_name = "akv-test2"
  environment = "dev"
  resource_group_name = "test-dev-rg"
  location = "eastus2"
  sku_name = "standard"
  soft_delete_retention_days = "6"
  purge_protection_enabled = "true"
}