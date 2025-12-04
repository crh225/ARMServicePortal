module "azure-key-vault-basic-4ded7d8b" {
  source       = "../../modules/azure-key-vault-basic"
  project_name = "12420252"
  environment = "dev"
  resource_group_name = "120420252-dev-rg"
  location = "eastus2"
  sku_name = "standard"
  soft_delete_retention_days = "7"
  purge_protection_enabled = "true"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-key-vault-basic"
    armportal-request-id  = "234"
  }
}