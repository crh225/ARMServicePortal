/**
 * Resource Cost Estimator
 * Estimates monthly costs for provisioned resources based on their SKU/configuration
 * This is different from actual usage costs - it shows the base provisioned capacity cost
 */

import { fetchAzurePricing } from "./azurePricing.js";

/**
 * Estimate monthly cost for a provisioned resource
 * @param {Object} resource - Azure resource object
 * @returns {Promise<number|null>} - Estimated monthly cost in USD, or null if cannot estimate
 */
export async function estimateResourceCost(resource) {
  if (!resource || !resource.type) {
    return null;
  }

  const resourceType = resource.type.toLowerCase();
  const location = resource.location || "eastus2";
  const tags = resource.tags || {};
  const properties = resource.properties || {};

  try {
    // Resource Groups are free
    if (resourceType === "microsoft.resources/resourcegroups") {
      return 0;
    }

    // Storage Accounts
    if (resourceType === "microsoft.storage/storageaccounts") {
      return await estimateStorageAccountCost(resource, location, properties);
    }

    // Key Vault
    if (resourceType === "microsoft.keyvault/vaults") {
      return await estimateKeyVaultCost(resource, location, properties);
    }

    // PostgreSQL Flexible Server
    if (resourceType === "microsoft.dbforpostgresql/flexibleservers") {
      return await estimatePostgresFlexibleCost(resource, location, properties);
    }

    // Container Instances
    if (resourceType === "microsoft.containerinstance/containergroups") {
      return await estimateContainerInstanceCost(resource, location, properties);
    }

    // Virtual Machines
    if (resourceType === "microsoft.compute/virtualmachines") {
      return await estimateVirtualMachineCost(resource, location, properties);
    }

    // Azure Database for MySQL
    if (resourceType === "microsoft.dbformysql/flexibleservers" ||
        resourceType === "microsoft.dbformysql/servers") {
      return await estimateMySQLCost(resource, location, properties);
    }

    // SQL Database
    if (resourceType === "microsoft.sql/servers/databases") {
      return await estimateSQLDatabaseCost(resource, location, properties);
    }

    // App Service Plans
    if (resourceType === "microsoft.web/serverfarms") {
      return await estimateAppServicePlanCost(resource, location, properties);
    }

    // Container Apps (consumption-based, harder to estimate without usage)
    if (resourceType === "microsoft.app/containerapps") {
      return null; // Consumption-based, cannot estimate without usage
    }

    // Default: cannot estimate
    return null;
  } catch (error) {
    console.error(`Error estimating cost for resource ${resource.name}:`, error);
    return null;
  }
}

/**
 * Estimate Storage Account cost
 */
async function estimateStorageAccountCost(resource, location, properties) {
  const sku = properties.sku?.name || properties.accountType || "Standard_LRS";

  // Parse tier and replication from SKU (e.g., "Standard_LRS" -> Standard, LRS)
  const parts = sku.split("_");
  const tier = parts[0] || "Standard";
  const replication = parts[1] || "LRS";

  const prices = await fetchAzurePricing({
    serviceName: "Storage",
    armRegionName: location
  });

  const skuFilter = `${tier} ${replication}`;
  const baseStoragePrice = prices.find(
    (p) =>
      p.skuName && p.skuName.includes(skuFilter) &&
      p.productName && p.productName.includes("Block Blob") &&
      p.meterName && p.meterName.includes("Data Stored")
  );

  // Baseline: 100 GB of storage
  const estimatedGB = 100;
  const pricePerGB = baseStoragePrice ? baseStoragePrice.retailPrice : 0.02;
  return pricePerGB * estimatedGB;
}

/**
 * Estimate Key Vault cost
 */
async function estimateKeyVaultCost(resource, location, properties) {
  const sku = properties.sku?.name || "standard";

  const prices = await fetchAzurePricing({
    serviceName: "Key Vault",
    armRegionName: location
  });

  const operationsPrice = prices.find(
    (p) =>
      p.meterName && p.meterName.includes("Secret Operations") &&
      p.skuName && p.skuName.toLowerCase().includes(sku.toLowerCase())
  );

  // Baseline: 10k operations per month
  const pricePerTenK = operationsPrice ? operationsPrice.retailPrice : 0.03;
  return pricePerTenK;
}

/**
 * Estimate PostgreSQL Flexible Server cost
 */
async function estimatePostgresFlexibleCost(resource, location, properties) {
  const sku = properties.sku?.name || "B_Standard_B1ms";
  const storageMb = properties.storage?.storageSizeGB
    ? properties.storage.storageSizeGB * 1024
    : (properties.storageProfile?.storageMB || 32768);
  const highAvailability = properties.highAvailability?.mode || "disabled";

  const prices = await fetchAzurePricing({
    serviceName: "Azure Database for PostgreSQL",
    armRegionName: location
  });

  // Parse SKU (e.g., "B_Standard_B1ms")
  const skuParts = sku.split("_");
  const tier = skuParts[0];
  const actualSku = skuParts.slice(2).join("_");

  const computePrice = prices.find(
    (p) =>
      p.productName && p.productName.includes("Flexible Server") &&
      p.skuName && p.skuName.includes(actualSku) &&
      p.meterName && p.meterName.includes("vCore")
  );

  const storagePrice = prices.find(
    (p) =>
      p.productName && p.productName.includes("Flexible Server") &&
      p.meterName && p.meterName.includes("Storage")
  );

  // Fallback pricing
  let computePricePerHour = 0.0205;
  if (computePrice) {
    computePricePerHour = computePrice.retailPrice;
  } else {
    if (tier === "GP") computePricePerHour = 0.16;
    else if (tier === "MO") computePricePerHour = 0.25;
  }

  const storagePricePerGbMonth = storagePrice ? storagePrice.retailPrice : 0.115;
  const hoursPerMonth = 730;
  const storageGb = storageMb / 1024;

  const monthlyComputeCost = computePricePerHour * hoursPerMonth;
  const monthlyStorageCost = storagePricePerGbMonth * storageGb;

  const haMultiplier = (highAvailability !== "disabled" && highAvailability !== "Disabled") ? 2 : 1;
  const totalComputeCost = monthlyComputeCost * haMultiplier;

  return totalComputeCost + monthlyStorageCost;
}

/**
 * Estimate Container Instance cost
 */
async function estimateContainerInstanceCost(resource, location, properties) {
  // Extract CPU and memory from container properties
  const containers = properties.containers || [];
  if (containers.length === 0) return null;

  let totalCpu = 0;
  let totalMemory = 0;

  containers.forEach(container => {
    const resources = container.properties?.resources?.requests || {};
    totalCpu += parseFloat(resources.cpu || 0);
    totalMemory += parseFloat(resources.memoryInGB || 0);
  });

  if (totalCpu === 0 && totalMemory === 0) return null;

  const prices = await fetchAzurePricing({
    serviceName: "Container Instances",
    armRegionName: location
  });

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

  const cpuPricePerSecond = cpuPrice ? cpuPrice.retailPrice : 0.0000125;
  const memoryPricePerSecond = memoryPrice ? memoryPrice.retailPrice : 0.0000014;

  // Assume 24/7 operation
  const secondsPerMonth = 30 * 24 * 60 * 60;
  const monthlyCpuCost = totalCpu * cpuPricePerSecond * secondsPerMonth;
  const monthlyMemoryCost = totalMemory * memoryPricePerSecond * secondsPerMonth;

  return monthlyCpuCost + monthlyMemoryCost;
}

/**
 * Estimate Virtual Machine cost
 */
async function estimateVirtualMachineCost(resource, location, properties) {
  const vmSize = properties.hardwareProfile?.vmSize;
  if (!vmSize) return null;

  const prices = await fetchAzurePricing({
    serviceName: "Virtual Machines",
    armRegionName: location
  });

  // Find the VM size pricing (Windows or Linux)
  const osType = properties.storageProfile?.osDisk?.osType || "Linux";
  const vmPrice = prices.find(
    (p) =>
      p.skuName && p.skuName === vmSize &&
      p.productName && p.productName.includes(osType) &&
      p.meterName && p.meterName.includes("Compute")
  );

  if (!vmPrice) return null;

  // Assume 24/7 operation
  const hoursPerMonth = 730;
  return vmPrice.retailPrice * hoursPerMonth;
}

/**
 * Estimate MySQL cost
 */
async function estimateMySQLCost(resource, location, properties) {
  const sku = properties.sku?.name || "B_Standard_B1ms";
  const storageMb = properties.storage?.storageSizeGB
    ? properties.storage.storageSizeGB * 1024
    : (properties.storageProfile?.storageMB || 32768);

  const prices = await fetchAzurePricing({
    serviceName: "Azure Database for MySQL",
    armRegionName: location
  });

  // Similar logic to PostgreSQL
  const skuParts = sku.split("_");
  const tier = skuParts[0];
  const actualSku = skuParts.slice(2).join("_");

  const computePrice = prices.find(
    (p) =>
      p.productName && p.productName.includes("Flexible Server") &&
      p.skuName && p.skuName.includes(actualSku)
  );

  const storagePrice = prices.find(
    (p) =>
      p.productName && p.productName.includes("Flexible Server") &&
      p.meterName && p.meterName.includes("Storage")
  );

  let computePricePerHour = 0.02;
  if (computePrice) {
    computePricePerHour = computePrice.retailPrice;
  }

  const storagePricePerGbMonth = storagePrice ? storagePrice.retailPrice : 0.10;
  const hoursPerMonth = 730;
  const storageGb = storageMb / 1024;

  const monthlyComputeCost = computePricePerHour * hoursPerMonth;
  const monthlyStorageCost = storagePricePerGbMonth * storageGb;

  return monthlyComputeCost + monthlyStorageCost;
}

/**
 * Estimate SQL Database cost
 */
async function estimateSQLDatabaseCost(resource, location, properties) {
  const sku = properties.sku?.name;
  if (!sku) return null;

  const prices = await fetchAzurePricing({
    serviceName: "SQL Database",
    armRegionName: location
  });

  // Find pricing for the SKU
  const dbPrice = prices.find(
    (p) =>
      p.skuName && p.skuName.includes(sku) &&
      p.meterName && p.meterName.includes("vCore")
  );

  if (!dbPrice) return null;

  const hoursPerMonth = 730;
  return dbPrice.retailPrice * hoursPerMonth;
}

/**
 * Estimate App Service Plan cost
 */
async function estimateAppServicePlanCost(resource, location, properties) {
  const sku = properties.sku?.name;
  if (!sku) return null;

  const prices = await fetchAzurePricing({
    serviceName: "Azure App Service",
    armRegionName: location
  });

  // Find the plan pricing
  const planPrice = prices.find(
    (p) =>
      p.skuName && p.skuName.includes(sku) &&
      p.meterName && p.meterName.includes("Compute")
  );

  if (!planPrice) {
    // Fallback pricing for common tiers
    const tier = sku.charAt(0);
    if (tier === "F") return 0; // Free tier
    if (tier === "D") return 0; // Shared tier (very cheap)
    if (tier === "B") return 13; // Basic ~$13/month
    if (tier === "S") return 74; // Standard ~$74/month
    if (tier === "P") return 146; // Premium ~$146/month
    return null;
  }

  const hoursPerMonth = 730;
  return planPrice.retailPrice * hoursPerMonth;
}
