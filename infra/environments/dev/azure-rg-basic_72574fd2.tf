module "azure-rg-basic_72574fd2" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test11"
  environment = "dev"
  location = "eastus2"
}