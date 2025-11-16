module "azure-rg-basic_0e23ff99" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test4"
  environment = "dev"
  location = "eastus2"
}