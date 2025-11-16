/**
 * Azure Retail Rates API Integration
 * Fetches live pricing data from Azure's public pricing API
 * API Docs: https://learn.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices
 */

const AZURE_PRICING_API = "https://prices.azure.com/api/retail/prices";

/**
 * Fetch pricing for Azure resources
 * @param {Object} params - Query parameters
 * @param {string} params.serviceName - Azure service name (e.g., "Storage", "Key Vault")
 * @param {string} params.armRegionName - Azure region (e.g., "eastus", "eastus2")
 * @param {string} params.skuName - SKU name filter
 * @returns {Promise<Array>} - Array of pricing items
 */
export async function fetchAzurePricing(params) {
  const filters = [];

  if (params.serviceName) {
    filters.push(`serviceName eq '${params.serviceName}'`);
  }

  if (params.armRegionName) {
    filters.push(`armRegionName eq '${params.armRegionName}'`);
  }

  if (params.skuName) {
    filters.push(`contains(skuName, '${params.skuName}')`);
  }

  const filterString = filters.length > 0 ? filters.join(" and ") : "";
  const url = filterString
    ? `${AZURE_PRICING_API}?$filter=${encodeURIComponent(filterString)}`
    : AZURE_PRICING_API;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Azure Pricing API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.Items || [];
  } catch (error) {
    console.error("Error fetching Azure pricing:", error);
    return [];
  }
}

/**
 * Estimate monthly cost for a blueprint deployment
 * @param {string} blueprintId - Blueprint ID
 * @param {Object} variables - Terraform variables
 * @returns {Promise<Object>} - Cost estimate
 */
export async function estimateBlueprintCost(blueprintId, variables) {
  const location = variables.location || "eastus2";
  const estimates = [];

  switch (blueprintId) {
    case "azure-rg-basic":
      // Resource groups are free
      estimates.push({
        resourceType: "Resource Group",
        skuName: "N/A",
        monthlyEstimate: 0,
        currency: "USD",
        note: "Resource groups have no cost"
      });
      break;

    case "azure-storage-basic":
      const storageCost = await estimateStorageCost(
        location,
        variables.account_tier || "Standard",
        variables.replication_type || "LRS"
      );
      estimates.push(storageCost);
      break;

    case "azure-key-vault-basic":
      const kvCost = await estimateKeyVaultCost(
        location,
        variables.sku_name || "standard"
      );
      estimates.push(kvCost);
      break;

    default:
      estimates.push({
        resourceType: "Unknown",
        skuName: "N/A",
        monthlyEstimate: null,
        currency: "USD",
        note: "Pricing data not available for this blueprint"
      });
  }

  const totalEstimate = estimates.reduce((sum, item) => {
    return sum + (item.monthlyEstimate || 0);
  }, 0);

  return {
    blueprintId,
    location,
    estimates,
    totalMonthlyEstimate: totalEstimate,
    currency: "USD",
    disclaimer: "Estimates are based on Azure retail pricing and may not reflect your actual costs due to discounts, reserved instances, or usage patterns."
  };
}

/**
 * Estimate Storage Account costs
 */
async function estimateStorageCost(location, tier, replication) {
  const prices = await fetchAzurePricing({
    serviceName: "Storage",
    armRegionName: location
  });

  // Find the base storage price for the given tier and replication
  const skuFilter = `${tier} ${replication}`;
  const baseStoragePrice = prices.find(
    (p) =>
      p.skuName && p.skuName.includes(skuFilter) &&
      p.productName && p.productName.includes("Block Blob") &&
      p.meterName && p.meterName.includes("Data Stored")
  );

  // Baseline estimate: 100 GB of block blob storage
  const estimatedGB = 100;
  const pricePerGB = baseStoragePrice ? baseStoragePrice.retailPrice : 0.02; // fallback to ~$0.02/GB
  const monthlyEstimate = pricePerGB * estimatedGB;

  return {
    resourceType: "Storage Account",
    skuName: `${tier} ${replication}`,
    monthlyEstimate: parseFloat(monthlyEstimate.toFixed(2)),
    currency: "USD",
    note: `Estimated for ${estimatedGB}GB of block blob storage. Actual costs vary by usage.`,
    breakdown: {
      baseStorageGB: estimatedGB,
      pricePerGB: pricePerGB
    }
  };
}

/**
 * Estimate Key Vault costs
 */
async function estimateKeyVaultCost(location, sku) {
  const prices = await fetchAzurePricing({
    serviceName: "Key Vault",
    armRegionName: location
  });

  // Key Vault has operational costs (per 10k operations)
  const operationsPrice = prices.find(
    (p) =>
      p.meterName && p.meterName.includes("Secret Operations") &&
      p.skuName && p.skuName.toLowerCase().includes(sku.toLowerCase())
  );

  // Baseline estimate: 10k operations per month
  const estimatedOperations = 10000;
  const pricePerTenK = operationsPrice ? operationsPrice.retailPrice : 0.03; // fallback to ~$0.03/10k ops
  const monthlyEstimate = pricePerTenK;

  return {
    resourceType: "Key Vault",
    skuName: sku,
    monthlyEstimate: parseFloat(monthlyEstimate.toFixed(2)),
    currency: "USD",
    note: `Estimated for ${estimatedOperations.toLocaleString()} operations/month. ${sku === "premium" ? "Includes HSM-protected keys." : "Standard tier."}`,
    breakdown: {
      operations: estimatedOperations,
      pricePerTenK: pricePerTenK
    }
  };
}
