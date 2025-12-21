/**
 * Terraform State Storage Infrastructure
 * These resources store the Terraform state for all environments
 * Marked as PERMANENT - should never be destroyed
 */



# Dev environment tfstate
resource "azurerm_resource_group" "tfstate_dev" {
  name     = "rg-armportal-tfstate-dev"
  location = "eastus2"

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "tfstate-infrastructure"
    armportal-request-id  = "PERMANENT"
    armportal-owner       = "platform-team"
    purpose               = "terraform-state-storage"
  }
}

resource "azurerm_storage_account" "tfstate_dev" {
  name                     = "armportaltfstate9059"
  resource_group_name      = azurerm_resource_group.tfstate_dev.name
  location                 = "eastus"
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "tfstate-infrastructure"
    armportal-request-id  = "PERMANENT"
    armportal-owner       = "platform-team"
    purpose               = "terraform-state-storage"
  }
}

resource "azurerm_storage_container" "tfstate_dev" {
  name                  = "tfstate"
  storage_account_name  = azurerm_storage_account.tfstate_dev.name
  container_access_type = "private"
}

# QA environment tfstate
resource "azurerm_resource_group" "tfstate_qa" {
  name     = "rg-armportal-tfstate-qa"
  location = "eastus2"

  tags = {
    armportal-environment = "qa"
    armportal-blueprint   = "tfstate-infrastructure"
    armportal-request-id  = "PERMANENT"
    armportal-owner       = "platform-team"
    purpose               = "terraform-state-storage"
  }
}

resource "azurerm_storage_account" "tfstate_qa" {
  name                     = "armportaltfstateqa9059"
  resource_group_name      = azurerm_resource_group.tfstate_qa.name
  location                 = azurerm_resource_group.tfstate_qa.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }

  tags = {
    armportal-environment = "qa"
    armportal-blueprint   = "tfstate-infrastructure"
    armportal-request-id  = "PERMANENT"
    armportal-owner       = "platform-team"
    purpose               = "terraform-state-storage"
  }
}

resource "azurerm_storage_container" "tfstate_qa" {
  name                  = "tfstate"
  storage_account_name  = azurerm_storage_account.tfstate_qa.name
  container_access_type = "private"
}

# Staging environment tfstate
resource "azurerm_resource_group" "tfstate_staging" {
  name     = "rg-armportal-tfstate-staging"
  location = "eastus2"

  tags = {
    armportal-environment = "staging"
    armportal-blueprint   = "tfstate-infrastructure"
    armportal-request-id  = "PERMANENT"
    armportal-owner       = "platform-team"
    purpose               = "terraform-state-storage"
  }
}

resource "azurerm_storage_account" "tfstate_staging" {
  name                     = "armportaltfstatestg9059"
  resource_group_name      = azurerm_resource_group.tfstate_staging.name
  location                 = azurerm_resource_group.tfstate_staging.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }

  tags = {
    armportal-environment = "staging"
    armportal-blueprint   = "tfstate-infrastructure"
    armportal-request-id  = "PERMANENT"
    armportal-owner       = "platform-team"
    purpose               = "terraform-state-storage"
  }
}

resource "azurerm_storage_container" "tfstate_staging" {
  name                  = "tfstate"
  storage_account_name  = azurerm_storage_account.tfstate_staging.name
  container_access_type = "private"
}

# Production environment tfstate
resource "azurerm_resource_group" "tfstate_prod" {
  name     = "rg-armportal-tfstate-prod"
  location = "eastus2"

  tags = {
    armportal-environment = "prod"
    armportal-blueprint   = "tfstate-infrastructure"
    armportal-request-id  = "PERMANENT"
    armportal-owner       = "platform-team"
    purpose               = "terraform-state-storage"
  }
}

resource "azurerm_storage_account" "tfstate_prod" {
  name                     = "armportaltfstateprod9059"
  resource_group_name      = azurerm_resource_group.tfstate_prod.name
  location                 = azurerm_resource_group.tfstate_prod.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"

  blob_properties {
    versioning_enabled = true
  }

  tags = {
    armportal-environment = "prod"
    armportal-blueprint   = "tfstate-infrastructure"
    armportal-request-id  = "PERMANENT"
    armportal-owner       = "platform-team"
    purpose               = "terraform-state-storage"
  }
}

resource "azurerm_storage_container" "tfstate_prod" {
  name                  = "tfstate"
  storage_account_name  = azurerm_storage_account.tfstate_prod.name
  container_access_type = "private"
}

# Get current client config
data "azurerm_client_config" "current" {}

# NOTE: The Terraform service principal needs "User Access Administrator" role
# to create role assignments. This must be granted manually once via Azure Portal:
#
# 1. Go to: Subscriptions → Your Subscription → Access Control (IAM)
# 2. Add role assignment: "User Access Administrator"
# 3. Assign to: Service Principal with object ID from error message
#
# After this one-time setup, Terraform will manage all role assignments.

# Container App role assignments removed - migrated to AKS
# The portal-api now runs on AKS with workload identity instead

