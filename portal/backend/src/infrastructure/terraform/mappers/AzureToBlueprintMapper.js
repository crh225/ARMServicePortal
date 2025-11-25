/**
 * Maps Azure resource types to blueprint module IDs
 */

/**
 * Map Azure resource type to blueprint module ID
 * @param {string} azureType - Azure resource type (e.g., "Microsoft.Storage/storageAccounts")
 * @returns {string|null} Blueprint module ID or null if no blueprint exists for this type
 */
export function mapAzureTypeToBlueprint(azureType) {
  const normalizedType = azureType.toLowerCase();

  const blueprintMap = {
    "microsoft.storage/storageaccounts": "azure-storage-basic",
    "microsoft.keyvault/vaults": "azure-key-vault-basic",
    "microsoft.resources/resourcegroups": "azure-rg-basic",
    "microsoft.resources/subscriptions/resourcegroups": "azure-rg-basic",
    "microsoft.dbforpostgresql/flexibleservers": "azure-postgres-flexible",
    "microsoft.web/staticsites": "azure-static-site",
    "microsoft.containerinstance/containergroups": "azure-aci",
    "microsoft.cdn/profiles": "azure-frontdoor"
  };

  return blueprintMap[normalizedType] || null;
}
