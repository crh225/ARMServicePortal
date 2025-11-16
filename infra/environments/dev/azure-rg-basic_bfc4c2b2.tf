module "azure-rg-basic_bfc4c2b2" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test2"
  environment = "dev"
  location = "eastus2"
}