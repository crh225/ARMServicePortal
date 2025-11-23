#!/bin/bash
set -e

# Terraform State Backup List Script
# Lists all available backups for a given environment
# Usage: ./list-tfstate-backups.sh <environment>
# Example: ./list-tfstate-backups.sh dev

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Error: Environment parameter required"
  echo "Usage: ./list-tfstate-backups.sh <environment>"
  echo "Example: ./list-tfstate-backups.sh dev"
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
BACKUP_PREFIX="${ENVIRONMENT}/backups/"

echo "=========================================="
echo "Terraform State Backups - $ENVIRONMENT"
echo "=========================================="
echo "Storage Account: $STORAGE_ACCOUNT"
echo "Container:       $CONTAINER_NAME"
echo "=========================================="
echo ""

# List all backups
az storage blob list \
  --account-name "$STORAGE_ACCOUNT" \
  --container-name "$CONTAINER_NAME" \
  --prefix "$BACKUP_PREFIX" \
  --auth-mode login \
  --query "[].{Name:name, Created:properties.creationTime, Size:properties.contentLength}" \
  --output table

echo ""
echo "To restore a backup, run:"
echo "  ./restore-tfstate.sh $ENVIRONMENT <backup-blob-name>"
echo ""
echo "Example:"
echo "  ./restore-tfstate.sh $ENVIRONMENT terraform.tfstate.backup-20250123-143022-abc1234"
