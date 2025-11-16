module "azure-rg-basic_eb59ac73" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test"
  environment = "dev"
  location = "eastus2"
}