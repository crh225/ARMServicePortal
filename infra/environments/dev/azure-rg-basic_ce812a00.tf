module "azure-rg-basic_ce812a00" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test1"
  environment = "dev"
  location = "eastus2"
}