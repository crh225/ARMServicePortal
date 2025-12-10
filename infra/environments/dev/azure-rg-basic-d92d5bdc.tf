module "azure-rg-basic-d92d5bdc" {
  source       = "../../modules/azure-rg-basic"
  project_name = "test129253"
  environment  = "dev"
  location     = "centralus"

  # ARM Portal tracking tags
  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "azure-rg-basic"
    armportal-request-id  = "azure-rg-basic-d92d5bdc"
  }
}

output "azure-rg-basic-d92d5bdc_resource_group_name" {
  value       = module.azure-rg-basic-d92d5bdc.resource_group_name
  description = "The name of the created resource group"
}