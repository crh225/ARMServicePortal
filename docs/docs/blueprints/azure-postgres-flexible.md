# Azure PostgreSQL Flexible Server

Creates a managed PostgreSQL Flexible Server for production workloads.

## Overview

Azure Database for PostgreSQL Flexible Server provides a fully managed database service with flexible scaling, high availability, and intelligent performance optimization.

## Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `project_name` | Name of your project | Yes | - |
| `environment` | Target environment | Yes | dev |
| `resource_group_name` | Existing Resource Group | Yes | - |
| `location` | Azure region | Yes | eastus2 |
| `postgres_version` | PostgreSQL version | No | 16 |
| `sku_name` | Compute tier | No | B_Standard_B1ms |
| `storage_mb` | Storage size in MB | No | 32768 |
| `admin_username` | Administrator username | Yes | - |
| `backup_retention_days` | Backup retention period | No | 7 |
| `geo_redundant_backup` | Enable geo-redundant backups | No | false |

## SKU Options

| Tier | Example SKU | Use Case |
|------|-------------|----------|
| Burstable | B_Standard_B1ms | Dev/Test |
| General Purpose | GP_Standard_D2s_v3 | Production |
| Memory Optimized | MO_Standard_E2s_v3 | High memory workloads |

## PostgreSQL Versions

- 16 (recommended)
- 15
- 14
- 13

## What Gets Created

- PostgreSQL Flexible Server
- Configured storage
- Automated backups
- Standard tags

## Connection Information

After provisioning, connect using:
```
Host: {server_name}.postgres.database.azure.com
Port: 5432
Database: postgres
SSL: Required
```

## Security Notes

- Admin password is stored in Key Vault (recommended)
- SSL is enforced by default
- Consider VNet integration for production
