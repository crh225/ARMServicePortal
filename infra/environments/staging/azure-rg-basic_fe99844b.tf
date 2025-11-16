module "azure-rg-basic_fe99844b" {
  source       = "../../modules/azure-rg-basic"
  project_name = "staging-test"
  environment = "staging"
  location = "eastus2"
}