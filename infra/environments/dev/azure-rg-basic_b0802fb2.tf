module "azure-rg-basic_b0802fb2" {
  source       = "../../modules/azure-rg-basic"
  project_name = "rg-testpr3"
  environment  = "dev"
  location     = "eastus2"
  request_id   = "4"
}