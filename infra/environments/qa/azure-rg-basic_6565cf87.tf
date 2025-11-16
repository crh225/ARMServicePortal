module "azure-rg-basic_6565cf87" {
  source       = "../../modules/azure-rg-basic"
  project_name = "qa-test"
  environment = "qa"
  location = "eastus2"
}