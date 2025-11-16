module "azure-rg-basic_92b8015f" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test6"
  environment = "dev"
  location = "eastus2"
}