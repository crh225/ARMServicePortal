# Homelab Resource Group
# For Azure Arc machines and edge devices

resource "azurerm_resource_group" "homelab" {
  name     = "rg-homelab"
  location = "East US"

  tags = {
    "purpose"               = "homelab"
    "managed-by"            = "terraform"
    "armportal-environment" = "shared"
  }
}

# Remove the old crossplane resource group from state without destroying it
# The RG still contains resources (Pi, identity) that need manual cleanup
removed {
  from = azurerm_resource_group.aks_crossplane

  lifecycle {
    destroy = false
  }
}