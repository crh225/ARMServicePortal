module "azure-rg-basic_4edbf0d3" {
  source       = "../../modules/azure-rg-basic"
  project_name = "rg-testpr1"
  environment = "dev"
  location = "eastus2"
}