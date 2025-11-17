module "azure-rg-basic_9e965f1b" {
  source       = "../../modules/azure-rg-basic"
  project_name = "testzz"
  environment = "dev"
  location = "eastus2"
}