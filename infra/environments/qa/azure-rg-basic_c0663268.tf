module "azure-rg-basic_c0663268" {
  source       = "../../modules/azure-rg-basic"
  project_name = "rg-test-112525"
  environment = "qa"
  location = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "qa"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "130"
  }
}

output "azure-rg-basic_c0663268_resource_group_name" {
  value       = module.azure-rg-basic_c0663268.resource_group_name
  description = "The name of the created resource group"
}