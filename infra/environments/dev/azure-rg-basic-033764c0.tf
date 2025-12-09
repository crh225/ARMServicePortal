module "azure-rg-basic-033764c0" {
  source       = "../../modules/azure-rg-basic"
  project_name = "teast"
  environment  = "dev"
  location     = "eastus2"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "239"
  }
}

output "azure-rg-basic-033764c0_resource_group_name" {
  value       = module.azure-rg-basic-033764c0.resource_group_name
  description = "The name of the created resource group"
}