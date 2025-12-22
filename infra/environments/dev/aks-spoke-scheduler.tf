# AKS Spoke Start/Stop Scheduler using Azure Automation
# Starts AKS at 7:30am EST, stops at 11:30pm EST (weekdays only)

resource "azurerm_automation_account" "aks_spoke_scheduler" {
  name                = "aa-aks-spoke-scheduler"
  location            = azurerm_resource_group.landing_zone_dev.location
  resource_group_name = azurerm_resource_group.landing_zone_dev.name
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

# Data source to find the Crossplane-managed spoke cluster
data "azurerm_kubernetes_cluster" "spoke" {
  name                = "aks-app-spoke-hsn7p-0e18fb09d1f7"
  resource_group_name = azurerm_resource_group.landing_zone_dev.name
}

# Grant the automation account permission to manage AKS spoke cluster
resource "azurerm_role_assignment" "aks_spoke_contributor" {
  scope                = data.azurerm_kubernetes_cluster.spoke.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_automation_account.aks_spoke_scheduler.identity[0].principal_id
}

# PowerShell runbook to start AKS spoke
resource "azurerm_automation_runbook" "start_aks_spoke" {
  name                    = "Start-AKS-Spoke-Cluster"
  location                = azurerm_resource_group.landing_zone_dev.location
  resource_group_name     = azurerm_resource_group.landing_zone_dev.name
  automation_account_name = azurerm_automation_account.aks_spoke_scheduler.name
  log_verbose             = false
  log_progress            = false
  runbook_type            = "PowerShell"

  content = <<-POWERSHELL
    # Start AKS Spoke Cluster Runbook
    # Uses managed identity for authentication

    try {
        # Connect using managed identity
        Connect-AzAccount -Identity

        $resourceGroupName = "${azurerm_resource_group.landing_zone_dev.name}"
        $clusterName = "${data.azurerm_kubernetes_cluster.spoke.name}"

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

# PowerShell runbook to stop AKS spoke
resource "azurerm_automation_runbook" "stop_aks_spoke" {
  name                    = "Stop-AKS-Spoke-Cluster"
  location                = azurerm_resource_group.landing_zone_dev.location
  resource_group_name     = azurerm_resource_group.landing_zone_dev.name
  automation_account_name = azurerm_automation_account.aks_spoke_scheduler.name
  log_verbose             = false
  log_progress            = false
  runbook_type            = "PowerShell"

  content = <<-POWERSHELL
    # Stop AKS Spoke Cluster Runbook
    # Uses managed identity for authentication
    # Removes Crossplane webhook that prevents stop operation

    try {
        # Connect using managed identity
        Connect-AzAccount -Identity

        $resourceGroupName = "${azurerm_resource_group.landing_zone_dev.name}"
        $clusterName = "${data.azurerm_kubernetes_cluster.spoke.name}"

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
    armportal-environment = "dev"
    armportal-blueprint   = "aks-scheduler"
  }
}

# Schedule to start AKS spoke at 7:30am EST - weekdays only
resource "azurerm_automation_schedule" "start_aks_spoke" {
  name                    = "start-aks-spoke-weekdays-730am"
  resource_group_name     = azurerm_resource_group.landing_zone_dev.name
  automation_account_name = azurerm_automation_account.aks_spoke_scheduler.name
  frequency               = "Week"
  interval                = 1
  timezone                = "America/New_York"
  start_time              = "${formatdate("YYYY-MM-DD", timeadd(timestamp(), "24h"))}T07:30:00-05:00"
  description             = "Start AKS spoke cluster at 7:30am EST on weekdays"

  week_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  lifecycle {
    ignore_changes = [start_time]
  }
}

# Schedule to stop AKS spoke at 11:30pm EST - weekdays only
resource "azurerm_automation_schedule" "stop_aks_spoke" {
  name                    = "stop-aks-spoke-weekdays-1130pm"
  resource_group_name     = azurerm_resource_group.landing_zone_dev.name
  automation_account_name = azurerm_automation_account.aks_spoke_scheduler.name
  frequency               = "Week"
  interval                = 1
  timezone                = "America/New_York"
  start_time              = "${formatdate("YYYY-MM-DD", timeadd(timestamp(), "24h"))}T23:30:00-05:00"
  description             = "Stop AKS spoke cluster at 11:30pm EST on weekdays"

  week_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

  lifecycle {
    ignore_changes = [start_time]
  }
}

# Link start runbook to schedule
resource "azurerm_automation_job_schedule" "start_aks_spoke" {
  resource_group_name     = azurerm_resource_group.landing_zone_dev.name
  automation_account_name = azurerm_automation_account.aks_spoke_scheduler.name
  schedule_name           = azurerm_automation_schedule.start_aks_spoke.name
  runbook_name            = azurerm_automation_runbook.start_aks_spoke.name
}

# Link stop runbook to schedule
resource "azurerm_automation_job_schedule" "stop_aks_spoke" {
  resource_group_name     = azurerm_resource_group.landing_zone_dev.name
  automation_account_name = azurerm_automation_account.aks_spoke_scheduler.name
  schedule_name           = azurerm_automation_schedule.stop_aks_spoke.name
  runbook_name            = azurerm_automation_runbook.stop_aks_spoke.name
}

output "spoke_automation_account_name" {
  value = azurerm_automation_account.aks_spoke_scheduler.name
}

output "spoke_automation_account_identity" {
  value = azurerm_automation_account.aks_spoke_scheduler.identity[0].principal_id
}
