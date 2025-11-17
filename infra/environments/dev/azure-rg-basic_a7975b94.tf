module "azure-rg-basic_a7975b94" {
  source       = "../../modules/azure-rg-basic"
  project_name = "testicon"
  environment = "dev"
  location = "eastus2"
}