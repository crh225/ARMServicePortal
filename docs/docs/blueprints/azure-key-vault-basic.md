# Azure Key Vault

Creates a Key Vault for secrets, keys, and certificate management.

## Overview

Azure Key Vault helps safeguard cryptographic keys and secrets used by cloud applications and services. This blueprint creates a Key Vault with soft delete enabled for data protection.

## Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `project_name` | Name of your project | Yes | - |
| `environment` | Target environment (dev/prod only) | Yes | dev |
| `resource_group_name` | Existing Resource Group | Yes | - |
| `location` | Azure region | Yes | eastus2 |
| `sku_name` | standard or premium | No | standard |
| `soft_delete_retention_days` | Days to retain deleted vaults | No | 90 |
| `purge_protection_enabled` | Prevent permanent deletion | No | false |

## SKU Options

| SKU | Description |
|-----|-------------|
| **standard** | Software-protected keys |
| **premium** | HSM-protected keys |

## What Gets Created

- Azure Key Vault with RBAC authorization
- Soft delete enabled (required by Azure)
- Optional purge protection

## Security Features

- **Soft Delete**: Deleted vaults and secrets are retained for recovery
- **Purge Protection**: When enabled, prevents permanent deletion during retention period
- **RBAC**: Uses Azure AD for access control

## Prerequisites

- An existing Resource Group

## Access Control

After creation, grant access using Azure RBAC roles:
- `Key Vault Administrator` - Full management
- `Key Vault Secrets User` - Read secrets
- `Key Vault Crypto User` - Use keys for crypto operations
