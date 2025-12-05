module "azure-key-vault-basic-09c79b07" {
  source       = "../../modules/azure-key-vault-basic"
  project_name = "backstageakv"
  environment = "dev"
  resource_group_name = "rg-testpr3-dev-rg"
  location = "eastus2"
  sku_name = "standard"
  soft_delete_retention_days = "7"
  purge_protection_enabled = "true"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-key-vault-basic"
    armportal-request-id  = "246"
  }
}