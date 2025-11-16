module "azure-rg-basic_627ad0b4" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test-p1"
  environment = "dev"
  location = "eastus2"
}