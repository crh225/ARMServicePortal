module "azure-rg-basic_f7af1783" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test235"
  environment = "dev"
  location = "eastus2"
}