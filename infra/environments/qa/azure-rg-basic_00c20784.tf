module "azure-rg-basic_00c20784" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test-promotion"
  environment = "dev"
  location = "eastus2"
}