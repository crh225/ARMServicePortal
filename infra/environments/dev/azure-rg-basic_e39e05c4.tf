module "azure-rg-basic_e39e05c4" {
  source       = "../../modules/azure-rg-basic"
  project_name = "my-test-project"
  environment = "dev"
  location = "eastus2"
}