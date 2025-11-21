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
 * @param {Object} blueprint - Optional blueprint object (for stacks)
 * @returns {Promise<Object>} - Cost estimate
 */
export async function estimateBlueprintCost(blueprintId, variables, blueprint = null) {
  const location = variables.location || "eastus2";
  const estimates = [];

  // Handle stack blueprints
  if (blueprint && blueprint.type === "stack") {
    return await estimateStackCost(blueprint, variables);
  }

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

    case "azure-static-site":
      const staticSiteCost = await estimateStaticWebsiteCost(
        location,
        variables.enable_cdn === "true"
      );
      estimates.push(staticSiteCost);
      break;

    case "azure-aci":
      const aciCost = await estimateAciCost(
        location,
        parseFloat(variables.cpu_cores || "1"),
        parseFloat(variables.memory_gb || "1")
      );
      estimates.push(aciCost);
      break;

    case "azure-postgres-flexible":
      const postgresCost = await estimatePostgresCost(
        location,
        variables.sku_name || "B_Standard_B1ms",
        parseInt(variables.storage_mb || "32768"),
        variables.high_availability_mode || "disabled"
      );
      estimates.push(postgresCost);
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

/**
 * Estimate Static Website costs (Storage Account + optional CDN)
 */
async function estimateStaticWebsiteCost(location, enableCdn) {
  const prices = await fetchAzurePricing({
    serviceName: "Storage",
    armRegionName: location
  });

  // Static websites use Standard tier with LRS replication
  const skuFilter = "Standard LRS";
  const baseStoragePrice = prices.find(
    (p) =>
      p.skuName && p.skuName.includes(skuFilter) &&
      p.productName && p.productName.includes("Block Blob") &&
      p.meterName && p.meterName.includes("Data Stored")
  );

  // Baseline estimate: 5 GB for a static website
  const estimatedGB = 5;
  const pricePerGB = baseStoragePrice ? baseStoragePrice.retailPrice : 0.02;
  const storageCost = pricePerGB * estimatedGB;

  // CDN pricing if enabled
  let cdnCost = 0;
  if (enableCdn) {
    const cdnPrices = await fetchAzurePricing({
      serviceName: "Content Delivery Network",
      armRegionName: location
    });

    // Standard CDN tier pricing (data transfer out)
    const cdnTransferPrice = cdnPrices.find(
      (p) =>
        p.skuName && p.skuName.includes("Standard") &&
        p.meterName && p.meterName.includes("Data Transfer")
    );

    // Baseline estimate: 50 GB/month data transfer
    const estimatedTransferGB = 50;
    const pricePerTransferGB = cdnTransferPrice ? cdnTransferPrice.retailPrice : 0.087;
    cdnCost = pricePerTransferGB * estimatedTransferGB;
  }

  const totalCost = storageCost + cdnCost;

  return {
    resourceType: "Static Website",
    skuName: enableCdn ? "Storage (Standard LRS) + CDN (Standard)" : "Storage (Standard LRS)",
    monthlyEstimate: parseFloat(totalCost.toFixed(2)),
    currency: "USD",
    note: `Estimated for ${estimatedGB}GB storage${enableCdn ? ` + 50GB CDN data transfer` : ""}. Actual costs vary by traffic and storage usage.`,
    breakdown: {
      storageGB: estimatedGB,
      storageCost: parseFloat(storageCost.toFixed(2)),
      cdnEnabled: enableCdn,
      cdnCost: enableCdn ? parseFloat(cdnCost.toFixed(2)) : 0
    }
  };
}

/**
 * Estimate Azure Container Instance costs
 */
async function estimateAciCost(location, cpuCores, memoryGb) {
  const prices = await fetchAzurePricing({
    serviceName: "Container Instances",
    armRegionName: location
  });

  // ACI pricing is per vCPU-second and per GB-second
  const cpuPrice = prices.find(
    (p) =>
      p.meterName && p.meterName.includes("vCPU") &&
      p.productName && p.productName.includes("Linux")
  );

  const memoryPrice = prices.find(
    (p) =>
      p.meterName && p.meterName.includes("Memory") &&
      p.productName && p.productName.includes("Linux")
  );

  // Fallback pricing (approximate US East 2 rates)
  const cpuPricePerSecond = cpuPrice ? cpuPrice.retailPrice : 0.0000125; // ~$0.0000125/vCPU-second
  const memoryPricePerSecond = memoryPrice ? memoryPrice.retailPrice : 0.0000014; // ~$0.0000014/GB-second

  // Calculate monthly cost assuming container runs 24/7
  const secondsPerMonth = 30 * 24 * 60 * 60; // ~2,592,000 seconds
  const monthlyCpuCost = cpuCores * cpuPricePerSecond * secondsPerMonth;
  const monthlyMemoryCost = memoryGb * memoryPricePerSecond * secondsPerMonth;
  const totalMonthlyCost = monthlyCpuCost + monthlyMemoryCost;

  return {
    resourceType: "Container Instance",
    skuName: `${cpuCores} vCPU, ${memoryGb}GB RAM`,
    monthlyEstimate: parseFloat(totalMonthlyCost.toFixed(2)),
    currency: "USD",
    note: `Estimated for continuous (24/7) operation. Actual costs vary based on runtime duration.`,
    breakdown: {
      cpuCores: cpuCores,
      memoryGb: memoryGb,
      cpuCostPerMonth: parseFloat(monthlyCpuCost.toFixed(2)),
      memoryCostPerMonth: parseFloat(monthlyMemoryCost.toFixed(2)),
      hoursPerMonth: 720
    }
  };
}

/**
 * Estimate PostgreSQL Flexible Server costs
 */
async function estimatePostgresCost(location, skuName, storageMb, highAvailability) {
  const prices = await fetchAzurePricing({
    serviceName: "Azure Database for PostgreSQL",
    armRegionName: location
  });

  // Parse SKU name (e.g., "B_Standard_B1ms" -> tier: Burstable, sku: B1ms)
  const skuParts = skuName.split("_");
  const tier = skuParts[0]; // B, GP, or MO
  const actualSku = skuParts.slice(2).join("_"); // e.g., B1ms, D2s_v3

  // Find compute pricing
  const computePrice = prices.find(
    (p) =>
      p.productName && p.productName.includes("Flexible Server") &&
      p.skuName && p.skuName.includes(actualSku) &&
      p.meterName && p.meterName.includes("vCore")
  );

  // Find storage pricing
  const storagePrice = prices.find(
    (p) =>
      p.productName && p.productName.includes("Flexible Server") &&
      p.meterName && p.meterName.includes("Storage")
  );

  // Fallback pricing based on tier (approximate rates)
  let computePricePerHour = 0.0205; // Default for B_Standard_B1ms
  if (computePrice) {
    computePricePerHour = computePrice.retailPrice;
  } else {
    // Approximate pricing by tier
    if (tier === "GP") computePricePerHour = 0.16; // GP_Standard_D2s_v3 approx
    else if (tier === "MO") computePricePerHour = 0.25; // MO_Standard_E2s_v3 approx
  }

  const storagePricePerGbMonth = storagePrice ? storagePrice.retailPrice : 0.115; // ~$0.115/GB/month

  // Calculate monthly costs
  const hoursPerMonth = 730; // Standard month
  const storageGb = storageMb / 1024;

  const monthlyComputeCost = computePricePerHour * hoursPerMonth;
  const monthlyStorageCost = storagePricePerGbMonth * storageGb;

  // High availability doubles the compute cost
  const haMultiplier = (highAvailability !== "disabled") ? 2 : 1;
  const totalComputeCost = monthlyComputeCost * haMultiplier;

  const totalMonthlyCost = totalComputeCost + monthlyStorageCost;

  const haNote = highAvailability !== "disabled"
    ? ` with ${highAvailability} high availability (2x compute cost)`
    : "";

  return {
    resourceType: "PostgreSQL Flexible Server",
    skuName: skuName,
    monthlyEstimate: parseFloat(totalMonthlyCost.toFixed(2)),
    currency: "USD",
    note: `${storageGb.toFixed(0)}GB storage${haNote}. Includes compute + storage. Excludes backup storage and IOPS costs.`,
    breakdown: {
      sku: skuName,
      computeCostPerMonth: parseFloat(totalComputeCost.toFixed(2)),
      storageCostPerMonth: parseFloat(monthlyStorageCost.toFixed(2)),
      storageGb: storageGb,
      highAvailability: highAvailability
    }
  };
}

/**
 * Estimate cost for a stack blueprint (aggregates component costs)
 */
async function estimateStackCost(stack, variables) {
  const location = variables.location || "eastus2";
  const componentEstimates = [];

  // Estimate cost for each component in the stack
  for (const component of stack.components) {
    // Resolve component variables (simple version - just use stack vars directly)
    const componentVars = {};
    for (const [key, value] of Object.entries(component.variables)) {
      // Extract variable value, handling ${stack.varname} syntax
      if (typeof value === "string" && value.startsWith("${stack.")) {
        const varName = value.match(/\$\{stack\.([^}]+)\}/)?.[1];
        if (varName && variables[varName] !== undefined) {
          componentVars[key] = variables[varName];
        }
      } else {
        componentVars[key] = value;
      }
    }

    // Get the component's cost estimate
    try {
      const estimate = await estimateBlueprintCost(component.blueprint, componentVars);
      componentEstimates.push({
        componentId: component.id,
        blueprintId: component.blueprint,
        ...estimate
      });
    } catch (error) {
      console.error(`Error estimating cost for component ${component.id}:`, error);
      componentEstimates.push({
        componentId: component.id,
        blueprintId: component.blueprint,
        estimates: [{
          resourceType: `Component: ${component.id}`,
          skuName: "N/A",
          monthlyEstimate: 0,
          currency: "USD",
          note: "Cost estimation failed"
        }],
        totalMonthlyEstimate: 0
      });
    }
  }

  // Aggregate all component estimates
  const allEstimates = componentEstimates.flatMap(ce => ce.estimates || []);
  const totalEstimate = componentEstimates.reduce((sum, ce) => {
    return sum + (ce.totalMonthlyEstimate || 0);
  }, 0);

  return {
    blueprintId: stack.id,
    location,
    isStack: true,
    componentEstimates,
    estimates: allEstimates,
    totalMonthlyEstimate: totalEstimate,
    currency: "USD",
    disclaimer: "Stack pricing is the sum of all component costs. Estimates are based on Azure retail pricing and may not reflect your actual costs due to discounts, reserved instances, or usage patterns."
  };
}
