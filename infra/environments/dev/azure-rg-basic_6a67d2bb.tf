module "azure-rg-basic_6a67d2bb" {
  source       = "../../modules/azure-rg-basic"
  project_name = "rg-testpr2"
  environment = "dev"
  location = "eastus2"
  request_id = "3"
}