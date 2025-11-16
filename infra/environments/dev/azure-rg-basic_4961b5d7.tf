module "azure-rg-basic_4961b5d7" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test"
  environment = "dev"
  location = "eastus2"
}