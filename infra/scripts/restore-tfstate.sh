#!/bin/bash
set -e

# Terraform State Restore Script
# Restores a previous backup of the Terraform state
# Usage: ./restore-tfstate.sh <environment> <backup-blob-name>
# Example: ./restore-tfstate.sh dev terraform.tfstate.backup-20250123-143022-abc1234

ENVIRONMENT=$1
BACKUP_BLOB_NAME=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$BACKUP_BLOB_NAME" ]; then
  echo "Error: Missing required parameters"
  echo "Usage: ./restore-tfstate.sh <environment> <backup-blob-name>"
  echo "Example: ./restore-tfstate.sh dev terraform.tfstate.backup-20250123-143022-abc1234"
  echo ""
  echo "To list available backups:"
  echo "  ./list-tfstate-backups.sh <environment>"
  exit 1
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|qa|staging|prod)$ ]]; then
  echo "Error: Invalid environment. Must be one of: dev, qa, staging, prod"
  exit 1
fi

# Set environment-specific variables
case $ENVIRONMENT in
  dev)
    STORAGE_ACCOUNT="armportaltfstate9059"
    RESOURCE_GROUP="rg-armportal-tfstate-dev"
    ;;
  qa)
    STORAGE_ACCOUNT="armportaltfstateqa9059"
    RESOURCE_GROUP="rg-armportal-tfstate-qa"
    ;;
  staging)
    STORAGE_ACCOUNT="armportaltfstatestg9059"
    RESOURCE_GROUP="rg-armportal-tfstate-staging"
    ;;
  prod)
    STORAGE_ACCOUNT="armportaltfstateprod9059"
    RESOURCE_GROUP="rg-armportal-tfstate-prod"
    ;;
esac

CONTAINER_NAME="tfstate"
STATE_BLOB="${ENVIRONMENT}/terraform.tfstate"
BACKUP_BLOB="${ENVIRONMENT}/backups/${BACKUP_BLOB_NAME}"

echo "=========================================="
echo "Terraform State Restore"
echo "=========================================="
echo "Environment:      $ENVIRONMENT"
echo "Storage Account:  $STORAGE_ACCOUNT"
echo "Backup Source:    $BACKUP_BLOB"
echo "Restore Target:   $STATE_BLOB"
echo "=========================================="

# Confirm with user
read -p "WARNING: This will REPLACE the current state. Are you sure? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 1
fi

# Check if backup exists
echo "Verifying backup exists..."
if ! az storage blob exists \
  --account-name "$STORAGE_ACCOUNT" \
  --container-name "$CONTAINER_NAME" \
  --name "$BACKUP_BLOB" \
  --auth-mode key \
  --output tsv | grep -q "True"; then
  echo "✗ Error: Backup blob not found: $BACKUP_BLOB"
  echo ""
  echo "To list available backups, run:"
  echo "  ./list-tfstate-backups.sh $ENVIRONMENT"
  exit 1
fi

# Create a backup of the current state before restoring
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
PRE_RESTORE_BACKUP="${ENVIRONMENT}/backups/terraform.tfstate.pre-restore-${TIMESTAMP}"

echo "Creating pre-restore backup of current state..."
az storage blob copy start \
  --account-name "$STORAGE_ACCOUNT" \
  --destination-container "$CONTAINER_NAME" \
  --destination-blob "$PRE_RESTORE_BACKUP" \
  --source-container "$CONTAINER_NAME" \
  --source-blob "$STATE_BLOB" \
  --auth-mode key \
  --output none

# Wait for pre-restore backup to complete
sleep 3

# Restore the backup
echo "Restoring state from backup..."
az storage blob copy start \
  --account-name "$STORAGE_ACCOUNT" \
  --destination-container "$CONTAINER_NAME" \
  --destination-blob "$STATE_BLOB" \
  --source-container "$CONTAINER_NAME" \
  --source-blob "$BACKUP_BLOB" \
  --auth-mode key \
  --output none

# Wait for restore to complete
echo "Waiting for restore to complete..."
STATUS="pending"
RETRY_COUNT=0
MAX_RETRIES=30

while [ "$STATUS" = "pending" ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  sleep 2
  STATUS=$(az storage blob show \
    --account-name "$STORAGE_ACCOUNT" \
    --container-name "$CONTAINER_NAME" \
    --name "$STATE_BLOB" \
    --auth-mode key \
    --query "properties.copy.status" \
    --output tsv 2>/dev/null || echo "pending")

  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$STATUS" = "success" ]; then
  echo "✓ State restored successfully!"
  echo "✓ Restored from: $BACKUP_BLOB"
  echo "✓ Pre-restore backup saved to: $PRE_RESTORE_BACKUP"
  echo ""
  echo "Next steps:"
  echo "  1. Run 'terraform init -reconfigure' to refresh local state"
  echo "  2. Run 'terraform plan' to verify the restored state"
  exit 0
else
  echo "✗ Error: Restore failed or timed out (status: $STATUS)"
  exit 1
fi
