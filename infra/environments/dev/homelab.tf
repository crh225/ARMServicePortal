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

# Note: The raspberry-pi-5 Azure Arc machine will need to be moved manually:
# az resource move \
#   --destination-group rg-homelab \
#   --ids "/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0/resourceGroups/rg-armportal-aks-crossplane-dev/providers/Microsoft.HybridCompute/machines/raspberry-pi-5"
#
# Then import into Terraform state if desired:
# terraform import azurerm_arc_machine.raspberry_pi /subscriptions/.../providers/Microsoft.HybridCompute/machines/raspberry-pi-5
