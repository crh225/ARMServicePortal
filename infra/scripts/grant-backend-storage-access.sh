#!/bin/bash
# Grant Storage Blob Data Reader role to backend container app
# This allows the backend to list and read Terraform state backups

set -e

PRINCIPAL_ID="8443ca8f-32d3-4ee6-a6a0-cea8dd7ca38d" # armportal-api-dev
SUBSCRIPTION_ID="f989de0f-8697-4a05-8c34-b82c941767c0"

# Dev environment
echo "Granting Storage Blob Data Reader for dev..."
az role assignment create \
  --role "Storage Blob Data Reader" \
  --assignee-object-id "$PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-armportal-tfstate-dev/providers/Microsoft.Storage/storageAccounts/armportaltfstate9059"

# QA environment
echo "Granting Storage Blob Data Reader for qa..."
az role assignment create \
  --role "Storage Blob Data Reader" \
  --assignee-object-id "$PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-armportal-tfstate-qa/providers/Microsoft.Storage/storageAccounts/armportaltfstateqa9059"

# Staging environment
echo "Granting Storage Blob Data Reader for staging..."
az role assignment create \
  --role "Storage Blob Data Reader" \
  --assignee-object-id "$PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-armportal-tfstate-staging/providers/Microsoft.Storage/storageAccounts/armportaltfstatestg9059"

# Prod environment
echo "Granting Storage Blob Data Reader for prod..."
az role assignment create \
  --role "Storage Blob Data Reader" \
  --assignee-object-id "$PRINCIPAL_ID" \
  --assignee-principal-type ServicePrincipal \
  --scope "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/rg-armportal-tfstate-prod/providers/Microsoft.Storage/storageAccounts/armportaltfstateprod9059"

echo "All permissions granted successfully!"
