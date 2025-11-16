module "azure-rg-basic_d2714934" {
  source       = "../../modules/azure-rg-basic"
  project_name = "testversion"
  environment = "dev"
  location = "eastus2"
}