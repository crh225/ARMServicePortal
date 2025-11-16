module "azure-rg-basic_11c8848a" {
  source       = "../../modules/azure-rg-basic"
  project_name = "prod-test"
  environment = "prod"
  location = "eastus2"
}