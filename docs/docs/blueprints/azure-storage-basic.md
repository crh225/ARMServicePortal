# Azure Storage Account

Creates a general-purpose v2 Storage Account in an existing Resource Group.

## Overview

Azure Storage Accounts provide scalable cloud storage for blobs, files, queues, and tables. This blueprint creates a standard storage account with configurable redundancy.

## Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `project_name` | Name of your project | Yes | - |
| `environment` | Target environment | Yes | dev |
| `resource_group_name` | Existing Resource Group | Yes | - |
| `location` | Azure region | Yes | eastus2 |
| `account_tier` | Standard or Premium | No | Standard |
| `replication_type` | LRS, GRS, RAGRS, ZRS | No | LRS |

## Replication Options

| Type | Description |
|------|-------------|
| **LRS** | Locally Redundant - 3 copies in single datacenter |
| **ZRS** | Zone Redundant - 3 copies across availability zones |
| **GRS** | Geo-Redundant - 6 copies across two regions |
| **RAGRS** | Read-Access Geo-Redundant - GRS + read access to secondary |

## What Gets Created

- Azure Storage Account (General Purpose v2)
- Blob service enabled
- Standard tags applied

## Prerequisites

- An existing Resource Group (create one using the Resource Group blueprint)

## Security Considerations

- Storage account keys should be rotated regularly
- Consider using Azure AD authentication for blob access
- Enable soft delete for blob protection
