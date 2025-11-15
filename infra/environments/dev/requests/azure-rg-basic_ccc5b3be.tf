module "azure-rg-basic_ccc5b3be" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test"
  environment = "dev"
  location = "eastus2"
}