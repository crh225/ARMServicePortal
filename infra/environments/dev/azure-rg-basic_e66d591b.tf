module "azure-rg-basic_e66d591b" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test3"
  environment = "dev"
  location = "eastus2"
}