module "azure-rg-basic_d62499b9" {
  source       = "../../modules/azure-rg-basic"
  project_name = "adsf"
  environment = "dev"
  location = "eastus2"
}