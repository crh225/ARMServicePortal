#!/bin/bash
# Note: We handle errors manually, so don't use 'set -e'
# This allows us to provide better error messages
set -u  # Exit on undefined variables
set -o pipefail  # Catch errors in pipes

# Terraform State Backup Script
# Creates a timestamped backup of the current Terraform state before applying changes
# Usage: ./backup-tfstate.sh <environment>
# Example: ./backup-tfstate.sh dev

ENVIRONMENT=$1

if [ -z "$ENVIRONMENT" ]; then
  echo "Error: Environment parameter required"
  echo "Usage: ./backup-tfstate.sh <environment>"
  echo "Example: ./backup-tfstate.sh dev"
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
TIMESTAMP=$(date -u +"%Y%m%d-%H%M%S")
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BACKUP_BLOB="${ENVIRONMENT}/backups/terraform.tfstate.backup-${TIMESTAMP}-${GIT_SHA}"

echo "=========================================="
echo "Terraform State Backup"
echo "=========================================="
echo "Environment:      $ENVIRONMENT"
echo "Storage Account:  $STORAGE_ACCOUNT"
echo "Resource Group:   $RESOURCE_GROUP"
echo "Source Blob:      $STATE_BLOB"
echo "Backup Blob:      $BACKUP_BLOB"
echo "Git SHA:          $GIT_SHA"
echo "Timestamp:        $TIMESTAMP"
echo "=========================================="

# Check if state blob exists
echo "Checking if state file exists..."

# First verify we can access the storage account
echo "Testing Azure login and storage account access..."
az storage account show --name "$STORAGE_ACCOUNT" --resource-group "$RESOURCE_GROUP" --query name -o tsv || {
  echo "Error: Cannot access storage account. This may be a permission or login issue."
  exit 0
}

# Get storage account key (same method Terraform uses)
echo "Retrieving storage account key..."
STORAGE_KEY=$(az storage account keys list \
  --account-name "$STORAGE_ACCOUNT" \
  --resource-group "$RESOURCE_GROUP" \
  --query '[0].value' \
  --output tsv 2>&1)

KEY_EXIT_CODE=$?

if [ $KEY_EXIT_CODE -ne 0 ]; then
  echo "Error: Failed to retrieve storage account key"
  echo "Output: $STORAGE_KEY"
  echo "Skipping backup."
  exit 0
fi

# Check if state blob exists using account key
echo "Checking if state blob exists..."
EXISTS_CHECK=$(az storage blob exists \
  --account-name "$STORAGE_ACCOUNT" \
  --container-name "$CONTAINER_NAME" \
  --name "$STATE_BLOB" \
  --account-key "$STORAGE_KEY" \
  --output tsv 2>&1)

EXISTS_EXIT_CODE=$?

if [ $EXISTS_EXIT_CODE -ne 0 ]; then
  echo "Error checking blob existence (exit code: $EXISTS_EXIT_CODE)"
  echo "Output: $EXISTS_CHECK"
  echo "Warning: Unable to check if state file exists. Skipping backup."
  exit 0
fi

# Check if blob exists
if ! echo "$EXISTS_CHECK" | grep -q "True"; then
  echo "Warning: State file does not exist yet. This may be the first apply."
  echo "Skipping backup."
  exit 0
fi

# Create backup by copying the current state
echo "Creating backup..."
az storage blob copy start \
  --account-name "$STORAGE_ACCOUNT" \
  --destination-container "$CONTAINER_NAME" \
  --destination-blob "$BACKUP_BLOB" \
  --source-container "$CONTAINER_NAME" \
  --source-blob "$STATE_BLOB" \
  --account-key "$STORAGE_KEY" \
  --output none

# Wait for copy to complete
echo "Waiting for backup to complete..."
STATUS="pending"
RETRY_COUNT=0
MAX_RETRIES=30

while [ "$STATUS" = "pending" ] && [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  sleep 2
  STATUS=$(az storage blob show \
    --account-name "$STORAGE_ACCOUNT" \
    --container-name "$CONTAINER_NAME" \
    --name "$BACKUP_BLOB" \
    --account-key "$STORAGE_KEY" \
    --query "properties.copy.status" \
    --output tsv 2>/dev/null || echo "pending")

  RETRY_COUNT=$((RETRY_COUNT + 1))
done

if [ "$STATUS" = "success" ]; then
  echo "✓ Backup created successfully!"
  echo "✓ Backup location: $BACKUP_BLOB"

  # Store backup reference in environment variable for GitHub Actions
  if [ -n "$GITHUB_OUTPUT" ]; then
    echo "backup_blob=${BACKUP_BLOB}" >> "$GITHUB_OUTPUT"
    echo "backup_timestamp=${TIMESTAMP}" >> "$GITHUB_OUTPUT"
    echo "backup_git_sha=${GIT_SHA}" >> "$GITHUB_OUTPUT"
  fi

  exit 0
else
  echo "✗ Error: Backup failed or timed out (status: $STATUS)"
  exit 1
fi
