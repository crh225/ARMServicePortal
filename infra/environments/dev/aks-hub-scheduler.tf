# AKS Hub Start/Stop Scheduler using Azure Automation
# Starts AKS at 5pm EST, stops at 10pm EST (weekdays only)

resource "azurerm_automation_account" "aks_hub_scheduler" {
  name                = "aa-aks-hub-scheduler"
  location            = azurerm_resource_group.landing_zone_hub.location
  resource_group_name = azurerm_resource_group.landing_zone_hub.name
  sku_name            = "Basic"

  identity {
    type = "SystemAssigned"
  }

  tags = {
    armportal-environment = "shared"
    armportal-blueprint   = "aks-scheduler"
    armportal-request-id  = "permanent"
    armportal-owner       = "platform-team"
  }
}

# Grant the automation account permission to manage AKS hub cluster
resource "azurerm_role_assignment" "aks_hub_contributor" {
  scope                = module.aks_mgmt_hub.cluster_id
  role_definition_name = "Contributor"
  principal_id         = azurerm_automation_account.aks_hub_scheduler.identity[0].principal_id
}

# PowerShell runbook to start AKS hub
resource "azurerm_automation_runbook" "start_aks_hub" {
  name                    = "Start-AKS-Hub-Cluster"
  location                = azurerm_resource_group.landing_zone_hub.location
  resource_group_name     = azurerm_resource_group.landing_zone_hub.name
  automation_account_name = azurerm_automation_account.aks_hub_scheduler.name
  log_verbose             = false
  log_progress            = false
  runbook_type            = "PowerShell"

  content = <<-POWERSHELL
    # Start AKS Hub Cluster Runbook
    # Uses managed identity for authentication

    try {
        # Connect using managed identity
        Connect-AzAccount -Identity

        $resourceGroupName = "${azurerm_resource_group.landing_zone_hub.name}"
        $clusterName = "aks-mgmt-hub"

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
    armportal-environment = "shared"
    armportal-blueprint   = "aks-scheduler"
  }
}

# PowerShell runbook to stop AKS hub
resource "azurerm_automation_runbook" "stop_aks_hub" {
  name                    = "Stop-AKS-Hub-Cluster"
  location                = azurerm_resource_group.landing_zone_hub.location
  resource_group_name     = azurerm_resource_group.landing_zone_hub.name
  automation_account_name = azurerm_automation_account.aks_hub_scheduler.name
  log_verbose             = false
  log_progress            = false
  runbook_type            = "PowerShell"

  content = <<-POWERSHELL
    # Stop AKS Hub Cluster Runbook
    # Uses managed identity for authentication
    # Removes Crossplane webhook that prevents stop operation

    try {
        # Connect using managed identity
        Connect-AzAccount -Identity

        $resourceGroupName = "${azurerm_resource_group.landing_zone_hub.name}"
        $clusterName = "aks-mgmt-hub"

        # Delete the Crossplane webhook that prevents stop/start using PowerShell cmdlet
        Write-Output "Removing Crossplane webhook configuration..."
        $result = Invoke-AzAksRunCommand `
            -ResourceGroupName $resourceGroupName `
            -Name $clusterName `
            -Command "kubectl delete validatingwebhookconfiguration crossplane-no-usages --ignore-not-found=true" `
            -Force

        if ($result.ExitCode -eq 0) {
            Write-Output "Webhook removed successfully"
        } else {
            Write-Output "Webhook removal completed with exit code: $($result.ExitCode)"
        }

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
    armportal-environment = "shared"
    armportal-blueprint   = "aks-scheduler"
  }
}

# Schedule to start AKS hub at 5pm EST - weekdays only
resource "azurerm_automation_schedule" "start_aks_hub" {
  name                    = "start-aks-hub-weekdays-5pm"
  resource_group_name     = azurerm_resource_group.landing_zone_hub.name
  automation_account_name = azurerm_automation_account.aks_hub_scheduler.name
  frequency               = "Week"
  interval                = 1
  timezone                = "America/New_York"
  start_time              = "${formatdate("YYYY-MM-DD", timeadd(timestamp(), "24h"))}T17:00:00-05:00"
  description             = "Start AKS hub cluster at 5pm EST on weekdays"

  week_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
}

# Schedule to stop AKS hub at 10pm EST - weekdays only
resource "azurerm_automation_schedule" "stop_aks_hub" {
  name                    = "stop-aks-hub-weekdays-10pm"
  resource_group_name     = azurerm_resource_group.landing_zone_hub.name
  automation_account_name = azurerm_automation_account.aks_hub_scheduler.name
  frequency               = "Week"
  interval                = 1
  timezone                = "America/New_York"
  start_time              = "${formatdate("YYYY-MM-DD", timeadd(timestamp(), "24h"))}T22:00:00-05:00"
  description             = "Stop AKS hub cluster at 10pm EST on weekdays"

  week_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
}

# Link start runbook to schedule
resource "azurerm_automation_job_schedule" "start_aks_hub" {
  resource_group_name     = azurerm_resource_group.landing_zone_hub.name
  automation_account_name = azurerm_automation_account.aks_hub_scheduler.name
  schedule_name           = azurerm_automation_schedule.start_aks_hub.name
  runbook_name            = azurerm_automation_runbook.start_aks_hub.name
}

# Link stop runbook to schedule
resource "azurerm_automation_job_schedule" "stop_aks_hub" {
  resource_group_name     = azurerm_resource_group.landing_zone_hub.name
  automation_account_name = azurerm_automation_account.aks_hub_scheduler.name
  schedule_name           = azurerm_automation_schedule.stop_aks_hub.name
  runbook_name            = azurerm_automation_runbook.stop_aks_hub.name
}

output "hub_automation_account_name" {
  value = azurerm_automation_account.aks_hub_scheduler.name
}

output "hub_automation_account_identity" {
  value = azurerm_automation_account.aks_hub_scheduler.identity[0].principal_id
}
