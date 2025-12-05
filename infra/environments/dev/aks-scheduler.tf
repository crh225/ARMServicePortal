# AKS Start/Stop Scheduler using Azure Automation
# Starts AKS at 9am EST, stops at 9pm EST (weekdays only)

resource "azurerm_automation_account" "aks_scheduler" {
  name                = "aa-aks-scheduler-dev"
  location            = "eastus2"
  resource_group_name = "rg-armportal-aks-crossplane-dev"
  sku_name            = "Basic"

  identity {
    type = "SystemAssigned"
  }

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "aks-scheduler"
    armportal-request-id  = "permanent"
    armportal-owner       = "platform-team"
  }
}

# Grant the automation account permission to manage AKS
resource "azurerm_role_assignment" "aks_contributor" {
  scope                = "/subscriptions/f989de0f-8697-4a05-8c34-b82c941767c0/resourceGroups/rg-armportal-aks-crossplane-dev/providers/Microsoft.ContainerService/managedClusters/aks-armportal-crossplane-dev"
  role_definition_name = "Contributor"
  principal_id         = azurerm_automation_account.aks_scheduler.identity[0].principal_id
}

# PowerShell runbook to start AKS
resource "azurerm_automation_runbook" "start_aks" {
  name                    = "Start-AKS-Cluster"
  location                = "eastus2"
  resource_group_name     = "rg-armportal-aks-crossplane-dev"
  automation_account_name = azurerm_automation_account.aks_scheduler.name
  log_verbose             = false
  log_progress            = false
  runbook_type            = "PowerShell"

  content = <<-POWERSHELL
    # Start AKS Cluster Runbook
    # Uses managed identity for authentication

    try {
        # Connect using managed identity
        Connect-AzAccount -Identity

        $resourceGroupName = "rg-armportal-aks-crossplane-dev"
        $clusterName = "aks-armportal-crossplane-dev"

        Write-Output "Starting AKS cluster: $clusterName in resource group: $resourceGroupName"

        Start-AzAksCluster -ResourceGroupName $resourceGroupName -Name $clusterName

        Write-Output "AKS cluster started successfully"
    }
    catch {
        Write-Error "Failed to start AKS cluster: $_"
        throw
    }
  POWERSHELL

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "aks-scheduler"
  }
}

# PowerShell runbook to stop AKS
resource "azurerm_automation_runbook" "stop_aks" {
  name                    = "Stop-AKS-Cluster"
  location                = "eastus2"
  resource_group_name     = "rg-armportal-aks-crossplane-dev"
  automation_account_name = azurerm_automation_account.aks_scheduler.name
  log_verbose             = false
  log_progress            = false
  runbook_type            = "PowerShell"

  content = <<-POWERSHELL
    # Stop AKS Cluster Runbook
    # Uses managed identity for authentication

    try {
        # Connect using managed identity
        Connect-AzAccount -Identity

        $resourceGroupName = "rg-armportal-aks-crossplane-dev"
        $clusterName = "aks-armportal-crossplane-dev"

        Write-Output "Stopping AKS cluster: $clusterName in resource group: $resourceGroupName"

        Stop-AzAksCluster -ResourceGroupName $resourceGroupName -Name $clusterName

        Write-Output "AKS cluster stopped successfully"
    }
    catch {
        Write-Error "Failed to stop AKS cluster: $_"
        throw
    }
  POWERSHELL

  tags = {
    armportal-environment = "dev"
    armportal-blueprint   = "aks-scheduler"
  }
}

# Schedule to start AKS at 9am EST (14:00 UTC) - weekdays only
resource "azurerm_automation_schedule" "start_aks" {
  name                    = "start-aks-weekdays-9am"
  resource_group_name     = "rg-armportal-aks-crossplane-dev"
  automation_account_name = azurerm_automation_account.aks_scheduler.name
  frequency               = "Week"
  interval                = 1
  timezone                = "America/New_York"
  start_time              = timeadd(timestamp(), "24h")
  description             = "Start AKS cluster at 9am EST on weekdays"

  week_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  lifecycle {
    ignore_changes = [start_time]
  }
}

# Schedule to stop AKS at 9pm EST (02:00 UTC next day) - weekdays only
resource "azurerm_automation_schedule" "stop_aks" {
  name                    = "stop-aks-weekdays-9pm"
  resource_group_name     = "rg-armportal-aks-crossplane-dev"
  automation_account_name = azurerm_automation_account.aks_scheduler.name
  frequency               = "Week"
  interval                = 1
  timezone                = "America/New_York"
  start_time              = timeadd(timestamp(), "24h")
  description             = "Stop AKS cluster at 9pm EST on weekdays"

  week_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  lifecycle {
    ignore_changes = [start_time]
  }
}

# Link start runbook to schedule
resource "azurerm_automation_job_schedule" "start_aks" {
  resource_group_name     = "rg-armportal-aks-crossplane-dev"
  automation_account_name = azurerm_automation_account.aks_scheduler.name
  schedule_name           = azurerm_automation_schedule.start_aks.name
  runbook_name            = azurerm_automation_runbook.start_aks.name
}

# Link stop runbook to schedule
resource "azurerm_automation_job_schedule" "stop_aks" {
  resource_group_name     = "rg-armportal-aks-crossplane-dev"
  automation_account_name = azurerm_automation_account.aks_scheduler.name
  schedule_name           = azurerm_automation_schedule.stop_aks.name
  runbook_name            = azurerm_automation_runbook.stop_aks.name
}

output "automation_account_name" {
  value = azurerm_automation_account.aks_scheduler.name
}

output "automation_account_identity" {
  value = azurerm_automation_account.aks_scheduler.identity[0].principal_id
}
