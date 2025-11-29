# Terraform State Backup and Restore

This directory contains scripts for managing Terraform state backups across all environments.

## Overview

The state backup system provides:

- **Automatic backups** before every Terraform apply on the main branch
- **Timestamped naming convention** for easy identification and rollback
- **Git SHA tracking** to correlate state with code versions
- **Manual restore capability** with safety confirmations
- **Azure Blob Storage versioning** for additional protection

## Naming Convention

Backup blobs follow this naming pattern:

```
{environment}/backups/terraform.tfstate.backup-{timestamp}-{git-sha}
```

Example:
```
dev/backups/terraform.tfstate.backup-20250123-143022-a4efa58
```

Components:
- `{timestamp}`: UTC timestamp in format `YYYYMMDD-HHMMSS`
- `{git-sha}`: Short Git commit SHA (7 characters)

## Scripts

### 1. backup-tfstate.sh

Creates a timestamped backup of the current Terraform state.

**Usage:**
```bash
./backup-tfstate.sh <environment>
```

**Example:**
```bash
cd infra/scripts
./backup-tfstate.sh dev
```

**When it runs:**
- Automatically before every `terraform apply` on the main branch (via GitHub Actions)
- Manually when needed for safety

**What it does:**
1. Checks if the current state file exists
2. Copies the state file to a backup blob with timestamp and Git SHA
3. Waits for the backup to complete
4. Outputs backup information to GitHub Actions (if running in CI)

### 2. list-tfstate-backups.sh

Lists all available backups for an environment.

**Usage:**
```bash
./list-tfstate-backups.sh <environment>
```

**Example:**
```bash
cd infra/scripts
./list-tfstate-backups.sh dev
```

**Output:**
```
==========================================
Terraform State Backups - dev
==========================================
Storage Account: armportaltfstate9059
Container:       tfstate
==========================================

Name                                                                      Created                    Size
------------------------------------------------------------------------  -------------------------  ------
dev/backups/terraform.tfstate.backup-20250123-143022-a4efa58            2025-01-23T14:30:22+00:00  45678
dev/backups/terraform.tfstate.backup-20250123-120015-896e081            2025-01-23T12:00:15+00:00  45234
dev/backups/terraform.tfstate.pre-restore-20250123-140000               2025-01-23T14:00:00+00:00  45456
```

### 3. restore-tfstate.sh

Restores a previous backup of the Terraform state.

**Usage:**
```bash
./restore-tfstate.sh <environment> <backup-blob-name>
```

**Example:**
```bash
cd infra/scripts
./restore-tfstate.sh dev terraform.tfstate.backup-20250123-143022-a4efa58
```

**What it does:**
1. Prompts for confirmation (requires typing "yes")
2. Creates a pre-restore backup of the current state
3. Restores the specified backup
4. Provides next steps for refreshing local state

**Safety features:**
- Requires explicit confirmation
- Creates a pre-restore backup automatically
- Verifies backup exists before attempting restore

## Common Workflows

### Scenario 1: Terraform Apply Failed on Main Branch

If a Terraform apply fails after merging to main:

1. **Check the PR comment** for the backup information:
   ```
   Backup Created: 20250123-143022
   Git SHA: a4efa58
   Blob Path: dev/backups/terraform.tfstate.backup-20250123-143022-a4efa58
   ```

2. **Restore the backup:**
   ```bash
   cd infra/scripts
   ./restore-tfstate.sh dev terraform.tfstate.backup-20250123-143022-a4efa58
   ```

3. **Refresh local state:**
   ```bash
   cd ../environments/dev
   terraform init -reconfigure
   terraform plan
   ```

4. **Fix the issue** in the code and create a new PR

### Scenario 2: Manual Testing Before Risky Apply

Before applying risky changes:

1. **Create a manual backup:**
   ```bash
   cd infra/scripts
   ./backup-tfstate.sh dev
   ```

2. **Note the backup name** from the output

3. **Apply your changes:**
   ```bash
   cd ../environments/dev
   terraform apply
   ```

4. **If something goes wrong, restore:**
   ```bash
   cd ../../scripts
   ./restore-tfstate.sh dev terraform.tfstate.backup-20250123-143022-a4efa58
   ```

### Scenario 3: View All Available Backups

To see all backups for an environment:

```bash
cd infra/scripts
./list-tfstate-backups.sh dev
```

### Scenario 4: Restore from Specific Git Commit

If you know the Git SHA you want to restore to:

1. **List backups and find the matching SHA:**
   ```bash
   ./list-tfstate-backups.sh dev | grep a4efa58
   ```

2. **Restore that backup:**
   ```bash
   ./restore-tfstate.sh dev terraform.tfstate.backup-20250123-143022-a4efa58
   ```

## GitHub Actions Integration

The backup script is integrated into the Terraform workflows:

### On Every Apply

When Terraform applies on the main branch:

1. GitHub Actions logs into Azure with managed identity
2. Runs `backup-tfstate.sh` to create a timestamped backup
3. Runs `terraform apply`
4. Comments on the associated PR with:
   - Apply status (success/failed)
   - Backup information (timestamp, Git SHA, blob path)
   - Restore command for easy rollback
   - Terraform outputs

### PR Comment Example

```markdown
## Terraform Apply Result

**Status:** ✅ Success

### State Backup
- **Backup Created:** 20250123-143022
- **Git SHA:** a4efa58
- **Blob Path:** `dev/backups/terraform.tfstate.backup-20250123-143022-a4efa58`

To restore this backup if needed:
```bash
./infra/scripts/restore-tfstate.sh dev terraform.tfstate.backup-20250123-143022-a4efa58
```

### Terraform Outputs

```json
{
  "frontend_url": {
    "value": "https://portal.chrishouse.io"
  },
  "backend_url": {
    "value": "https://portal-api.chrishouse.io"
  }
}
```

## Environment-Specific Storage Accounts

Each environment has its own dedicated storage account:

| Environment | Storage Account          | Resource Group               |
|-------------|--------------------------|------------------------------|
| dev         | armportaltfstate9059     | rg-armportal-tfstate-dev     |
| qa          | armportaltfstateqa9059   | rg-armportal-tfstate-qa      |
| staging     | armportaltfstatestg9059  | rg-armportal-tfstate-staging |
| prod        | armportaltfstateprod9059 | rg-armportal-tfstate-prod    |

All storage accounts have **blob versioning enabled** for additional protection.

## Prerequisites

To use these scripts, you need:

1. **Azure CLI** installed and configured
2. **Azure authentication** via `az login` or managed identity (in GitHub Actions)
3. **Appropriate permissions** on the storage account:
   - `Storage Blob Data Contributor` or higher
   - Read/Write/List access to the tfstate container

## Troubleshooting

### "State file does not exist yet"

This is normal for the first apply in a new environment. The backup is skipped.

### "Backup failed or timed out"

Check:
- Azure CLI is authenticated (`az account show`)
- Permissions on the storage account
- Storage account name is correct for the environment

### "Backup blob not found"

When restoring, ensure:
- You're using the correct environment
- The blob name matches exactly (use `list-tfstate-backups.sh` to verify)
- You have read permissions on the storage account

### GitHub Actions "Permission denied"

The workflow needs `id-token: write` and `contents: read` permissions to use Azure OIDC login.

## Best Practices

1. **Always create a backup** before risky applies (the workflow does this automatically)
2. **Test restores periodically** to ensure the process works
3. **Review PR comments** after applies to verify backup was created
4. **Keep backups for at least 30 days** (configure blob lifecycle policies if needed)
5. **Document the reason** when performing manual restores
6. **Run `terraform plan`** after restoring to verify state matches code

## Additional Protection

Beyond these scripts, state is protected by:

- **Azure Blob Versioning**: Automatic versioning of all state file changes
- **Access Control**: Role-based access to storage accounts
- **State Locking**: Terraform's built-in state locking via Azure Storage
- **Immutable Infrastructure**: Infrastructure defined in code and version controlled

## Support

For issues or questions:
- Check the GitHub Actions logs for detailed error messages
- Review this README for common scenarios
- Check Azure Storage logs in the Azure Portal
