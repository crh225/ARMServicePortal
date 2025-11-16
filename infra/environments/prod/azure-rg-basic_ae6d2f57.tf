module "azure-rg-basic_ae6d2f57" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test5"
  environment = "prod"
  location = "eastus2"
}