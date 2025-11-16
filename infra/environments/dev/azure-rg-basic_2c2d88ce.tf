module "azure-rg-basic_2c2d88ce" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test1"
  environment = "dev"
  location = "eastus2"
}