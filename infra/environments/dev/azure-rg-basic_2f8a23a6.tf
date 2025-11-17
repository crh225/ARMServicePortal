module "azure-rg-basic_2f8a23a6" {
  source       = "../../modules/azure-rg-basic"
  project_name = "testwf"
  environment = "dev"
  location = "eastus2"
}