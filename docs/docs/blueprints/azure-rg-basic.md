# Azure Resource Group

Creates a Resource Group using a standardized naming convention.

## Overview

Azure Resource Groups are logical containers that hold related resources for an Azure solution. This blueprint creates a resource group following organizational naming standards.

## Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `project_name` | Name of your project | Yes | - |
| `environment` | Target environment (dev/qa/staging/prod) | Yes | dev |
| `location` | Azure region | Yes | eastus2 |

## Naming Convention

Resource groups are named: `{project_name}-{environment}-rg`

Example: `myapp-dev-rg`

## What Gets Created

- Azure Resource Group with standard tags
- Configured for the specified Azure region

## Tags Applied

| Tag | Value |
|-----|-------|
| `environment` | Selected environment |
| `project` | Project name |
| `managed-by` | arm-portal |

## Usage

1. Navigate to **Create** in Backstage
2. Select **Azure Resource Group**
3. Fill in the required parameters
4. Review and create the Pull Request
5. Merge the PR to trigger provisioning

## After Provisioning

Once the resource group is created, you can:
- Deploy additional resources into it using other blueprints
- View it in the Azure Portal
- Track it in the Backstage catalog
