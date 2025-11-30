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

    case "azure-frontdoor":
      const frontDoorCost = await estimateFrontDoorCost(
        location,
        variables.sku_name || "Standard_AzureFrontDoor",
        variables.custom_domain ? true : false
      );
      estimates.push(frontDoorCost);
      break;

    case "azure-elk-stack":
      const elkCost = await estimateElkStackCost(
        location,
        parseFloat(variables.elasticsearch_cpu || "2"),
        parseFloat(variables.elasticsearch_memory || "4"),
        parseFloat(variables.logstash_cpu || "1"),
        parseFloat(variables.logstash_memory || "2"),
        parseFloat(variables.kibana_cpu || "1"),
        parseFloat(variables.kibana_memory || "2"),
        parseInt(variables.elasticsearch_storage_gb || "50")
      );
      estimates.push(...elkCost);
      break;

    case "azure-elastic-managed":
      // Azure Elastic (Managed Service) - consumption-based pricing
      // Base estimate is around $95-150/month for small deployments
      estimates.push({
        resourceType: "Azure Elastic Cloud",
        skuName: variables.sku_name || "ess-consumption-2024_Monthly",
        monthlyEstimate: 95,
        currency: "USD",
        note: "Managed Elasticsearch service with consumption-based pricing. Actual cost varies based on usage."
      });
      break;

    case "azure-function":
      const functionCost = await estimateFunctionCost(
        location,
        variables.sku_name || "Y1",
        variables.os_type || "Linux",
        variables.runtime_stack || "node"
      );
      estimates.push(functionCost);
      break;

    case "azure-app-configuration": {
      // Azure App Configuration pricing:
      // Free tier: 10 MB storage, 1,000 requests/day - $0
      // Standard tier: $1.20/day (~$36/month) + $0.06 per 10,000 requests over 200K
      const appConfigSku = variables.sku || "free";
      const isStandard = appConfigSku === "standard";

      estimates.push({
        resourceType: "Azure App Configuration",
        skuName: isStandard ? "Standard" : "Free",
        monthlyEstimate: isStandard ? 36 : 0,
        currency: "USD",
        note: isStandard
          ? "Standard tier: $1.20/day + $0.06 per 10K requests over 200K/day"
          : "Free tier: 10 MB storage, 1,000 requests/day"
      });
      break;
    }

    case "xp-application-environment": {
      // Crossplane Application Environment - Kubernetes-based deployment
      // Cost is based on AKS node resources consumed, not Azure-managed services
      const xpFrontendReplicas = parseInt(variables.frontend_replicas || "2");
      const xpBackendReplicas = parseInt(variables.backend_replicas || "2");
      const xpDbStorageGB = parseInt(variables.database_storageGB || "10");

      // Estimate based on typical AKS resource costs:
      // - Pods: ~$10-15/pod/month for small workloads (CPU/memory share of node)
      // - PostgreSQL PVC: ~$0.10/GB/month for Azure Disk
      // - Ingress/Load Balancer: ~$20/month
      const xpPvcCost = xpDbStorageGB * 0.10;

      estimates.push({
        resourceType: "Frontend Pods",
        skuName: `${xpFrontendReplicas} replica(s)`,
        monthlyEstimate: xpFrontendReplicas * 12,
        currency: "USD",
        note: "Kubernetes deployment resource share"
      });
      estimates.push({
        resourceType: "Backend Pods",
        skuName: `${xpBackendReplicas} replica(s)`,
        monthlyEstimate: xpBackendReplicas * 12,
        currency: "USD",
        note: "Kubernetes deployment resource share"
      });
      estimates.push({
        resourceType: "PostgreSQL Pod + Storage",
        skuName: `${xpDbStorageGB}GB PVC`,
        monthlyEstimate: 12 + xpPvcCost,
        currency: "USD",
        note: "StatefulSet with persistent volume"
      });
      estimates.push({
        resourceType: "Ingress / Load Balancer",
        skuName: "NGINX Ingress",
        monthlyEstimate: 20,
        currency: "USD",
        note: "Shared ingress controller cost allocation"
      });
      break;
    }

    case "xp-redis": {
      // Crossplane Redis - Kubernetes-based deployment
      const redisStorageGB = parseInt(variables.storageGB || "5");
      const redisMemoryMB = parseInt(variables.memoryLimitMB || "256");

      // Cost breakdown:
      // - Redis Pod: ~$3-5/month for small instance (CPU/memory share of node)
      // - PVC: ~$0.10/GB/month for Azure Disk
      const pvcCost = redisStorageGB * 0.10;

      estimates.push({
        resourceType: "Redis Pod",
        skuName: `${redisMemoryMB}MB memory limit`,
        monthlyEstimate: 4,
        currency: "USD",
        note: "Kubernetes deployment resource share"
      });
      estimates.push({
        resourceType: "Redis Storage (PVC)",
        skuName: `${redisStorageGB}GB Azure Disk`,
        monthlyEstimate: pvcCost,
        currency: "USD",
        note: "Persistent volume for Redis data"
      });
      estimates.push({
        resourceType: "Shared Infrastructure",
        skuName: "Ingress + monitoring",
        monthlyEstimate: 1,
        currency: "USD",
        note: "Allocated share of cluster services"
      });
      break;
    }

    case "xp-rabbitmq": {
      // Crossplane RabbitMQ - Kubernetes-based deployment
      const rmqStorageGB = parseInt(variables.storageGB || "5");
      const rmqMemoryMB = parseInt(variables.memoryLimitMB || "512");

      // Cost breakdown:
      // - RabbitMQ Pod: ~$5-8/month for small instance (CPU/memory share of node)
      // - PVC: ~$0.10/GB/month for Azure Disk
      // - Management UI ingress: minimal additional cost
      const pvcCost = rmqStorageGB * 0.10;

      estimates.push({
        resourceType: "RabbitMQ Pod",
        skuName: `${rmqMemoryMB}MB memory limit`,
        monthlyEstimate: 7,
        currency: "USD",
        note: "Kubernetes deployment with management plugin"
      });
      estimates.push({
        resourceType: "RabbitMQ Storage (PVC)",
        skuName: `${rmqStorageGB}GB Azure Disk`,
        monthlyEstimate: pvcCost,
        currency: "USD",
        note: "Persistent volume for message data"
      });
      estimates.push({
        resourceType: "Management UI Ingress",
        skuName: "HTTPS endpoint",
        monthlyEstimate: 2,
        currency: "USD",
        note: "Allocated share of ingress controller"
      });
      estimates.push({
        resourceType: "Shared Infrastructure",
        skuName: "Monitoring + TLS",
        monthlyEstimate: 1,
        currency: "USD",
        note: "Allocated share of cluster services"
      });
      break;
    }

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
 * Estimate Azure Front Door costs
 */
async function estimateFrontDoorCost(location, skuName, hasCustomDomain) {
  const prices = await fetchAzurePricing({
    serviceName: "Azure Front Door Service",
    armRegionName: location
  });

  // Front Door pricing structure:
  // - Base fee (per profile/month)
  // - Data transfer out (per GB)
  // - Requests (per 10k requests)
  // - Custom domain HTTPS (per domain/month)

  // Determine SKU tier
  const isPremium = skuName.includes("Premium");

  // Base monthly fee (fallback to known rates if API doesn't return)
  // Standard: ~$35/month, Premium: ~$330/month
  const baseFeeMonthly = isPremium ? 330 : 35;

  // Estimated data transfer out: 100GB/month
  const estimatedDataTransferGB = 100;
  const dataTransferPricePerGB = isPremium ? 0.01 : 0.01; // ~$0.01/GB for first 10TB

  // Estimated requests: 1 million/month
  const estimatedRequests = 1000000;
  const requestsPer10k = estimatedRequests / 10000;
  const requestPricePer10k = 0.0075; // ~$0.0075 per 10k requests

  // Calculate costs
  const dataTransferCost = estimatedDataTransferGB * dataTransferPricePerGB;
  const requestCost = requestsPer10k * requestPricePer10k;
  const customDomainCost = hasCustomDomain ? 0 : 0; // Custom domains are free with Front Door

  const totalMonthlyCost = baseFeeMonthly + dataTransferCost + requestCost + customDomainCost;

  return {
    resourceType: "Azure Front Door",
    skuName: skuName,
    monthlyEstimate: parseFloat(totalMonthlyCost.toFixed(2)),
    currency: "USD",
    note: `${isPremium ? "Premium" : "Standard"} tier with estimated ${estimatedDataTransferGB}GB data transfer and ${(estimatedRequests / 1000000).toFixed(1)}M requests/month. ${hasCustomDomain ? "Includes custom domain with free managed certificate." : ""}`,
    breakdown: {
      baseFee: baseFeeMonthly,
      dataTransferGB: estimatedDataTransferGB,
      dataTransferCost: parseFloat(dataTransferCost.toFixed(2)),
      requestsPerMonth: estimatedRequests,
      requestCost: parseFloat(requestCost.toFixed(2)),
      customDomain: hasCustomDomain,
      customDomainCost: customDomainCost
    }
  };
}

/**
 * Estimate ELK Stack costs (Container Instances + Storage)
 */
async function estimateElkStackCost(
  location,
  elasticsearchCpu,
  elasticsearchMemory,
  logstashCpu,
  logstashMemory,
  kibanaCpu,
  kibanaMemory,
  storageGb
) {
  const estimates = [];

  // Fetch ACI pricing once for all containers
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

  // Fallback pricing (approximate US East 2 rates)
  const cpuPricePerSecond = cpuPrice ? cpuPrice.retailPrice : 0.0000125;
  const memoryPricePerSecond = memoryPrice ? memoryPrice.retailPrice : 0.0000014;
  const secondsPerMonth = 30 * 24 * 60 * 60;

  // Calculate Elasticsearch container cost
  const esCpuCost = elasticsearchCpu * cpuPricePerSecond * secondsPerMonth;
  const esMemoryCost = elasticsearchMemory * memoryPricePerSecond * secondsPerMonth;
  const elasticsearchTotal = esCpuCost + esMemoryCost;

  estimates.push({
    resourceType: "Elasticsearch Container",
    skuName: `${elasticsearchCpu} vCPU, ${elasticsearchMemory}GB RAM`,
    monthlyEstimate: parseFloat(elasticsearchTotal.toFixed(2)),
    currency: "USD",
    note: "24/7 operation"
  });

  // Calculate Logstash container cost
  const lsCpuCost = logstashCpu * cpuPricePerSecond * secondsPerMonth;
  const lsMemoryCost = logstashMemory * memoryPricePerSecond * secondsPerMonth;
  const logstashTotal = lsCpuCost + lsMemoryCost;

  estimates.push({
    resourceType: "Logstash Container",
    skuName: `${logstashCpu} vCPU, ${logstashMemory}GB RAM`,
    monthlyEstimate: parseFloat(logstashTotal.toFixed(2)),
    currency: "USD",
    note: "24/7 operation"
  });

  // Calculate Kibana container cost
  const kbCpuCost = kibanaCpu * cpuPricePerSecond * secondsPerMonth;
  const kbMemoryCost = kibanaMemory * memoryPricePerSecond * secondsPerMonth;
  const kibanaTotal = kbCpuCost + kbMemoryCost;

  estimates.push({
    resourceType: "Kibana Container",
    skuName: `${kibanaCpu} vCPU, ${kibanaMemory}GB RAM`,
    monthlyEstimate: parseFloat(kibanaTotal.toFixed(2)),
    currency: "USD",
    note: "24/7 operation"
  });

  // Calculate Azure File Share storage cost (for Elasticsearch data)
  // Premium Files pricing: ~$0.20/GB/month
  const storagePrice = await fetchAzurePricing({
    serviceName: "Storage",
    armRegionName: location
  });

  const fileStoragePrice = storagePrice.find(
    (p) =>
      p.meterName && p.meterName.includes("Premium Files") &&
      p.productName && p.productName.includes("Premium Files")
  ) || { retailPrice: 0.20 }; // Fallback to ~$0.20/GB/month

  const storageCost = storageGb * fileStoragePrice.retailPrice;

  estimates.push({
    resourceType: "Azure File Share Storage",
    skuName: `${storageGb}GB Premium Files`,
    monthlyEstimate: parseFloat(storageCost.toFixed(2)),
    currency: "USD",
    note: "Persistent storage for Elasticsearch data"
  });

  // Add Storage Account base cost (minimal)
  estimates.push({
    resourceType: "Storage Account",
    skuName: "Standard LRS",
    monthlyEstimate: 0.05,
    currency: "USD",
    note: "Base storage account cost"
  });

  return estimates;
}

/**
 * Estimate Azure Function costs
 */
async function estimateFunctionCost(location, skuName, osType, runtimeStack) {
  // Azure Functions pricing tiers:
  // - Y1 (Consumption): Pay per execution + execution time
  // - EP1/EP2/EP3 (Premium): Monthly base + compute
  // - B1/S1/P1v2 etc (Dedicated): Fixed monthly cost

  const isConsumption = skuName === "Y1";
  const isPremium = skuName.startsWith("EP");

  if (isConsumption) {
    // Consumption plan: First 1M executions free, then $0.20/million
    // First 400,000 GB-s free, then $0.000016/GB-s
    // For baseline estimate, assume light usage within free tier
    return {
      resourceType: "Azure Function (Consumption)",
      skuName: `${skuName} - ${osType}/${runtimeStack}`,
      monthlyEstimate: 0,
      currency: "USD",
      note: "Consumption plan: Pay-per-execution. First 1M executions and 400,000 GB-s/month free. Estimated $0 for light usage.",
      breakdown: {
        plan: "Consumption (Y1)",
        executionsIncluded: "1,000,000 free",
        gbSecondsIncluded: "400,000 free",
        executionPricePerMillion: 0.20,
        gbSecondPrice: 0.000016
      }
    };
  }

  if (isPremium) {
    // Premium plan pricing (approximate rates)
    const premiumPricing = {
      EP1: { vcpu: 1, memoryGb: 3.5, pricePerHour: 0.173 },
      EP2: { vcpu: 2, memoryGb: 7, pricePerHour: 0.346 },
      EP3: { vcpu: 4, memoryGb: 14, pricePerHour: 0.692 }
    };

    const planDetails = premiumPricing[skuName] || premiumPricing.EP1;
    const hoursPerMonth = 730;
    const monthlyComputeCost = planDetails.pricePerHour * hoursPerMonth;

    // Storage Account for function (~$1/month for minimal usage)
    const storageCost = 1;
    // Application Insights (~$2.30/GB, estimate 1GB/month)
    const appInsightsCost = 2.30;

    const totalMonthlyCost = monthlyComputeCost + storageCost + appInsightsCost;

    return {
      resourceType: "Azure Function (Premium)",
      skuName: `${skuName} - ${osType}/${runtimeStack}`,
      monthlyEstimate: parseFloat(totalMonthlyCost.toFixed(2)),
      currency: "USD",
      note: `Premium plan with ${planDetails.vcpu} vCPU, ${planDetails.memoryGb}GB RAM. Always-on, VNet integration, no cold starts. Includes storage + App Insights.`,
      breakdown: {
        plan: `Premium (${skuName})`,
        vcpu: planDetails.vcpu,
        memoryGb: planDetails.memoryGb,
        computeCost: parseFloat(monthlyComputeCost.toFixed(2)),
        storageCost: storageCost,
        appInsightsCost: appInsightsCost,
        hoursPerMonth: hoursPerMonth
      }
    };
  }

  // Dedicated (App Service) plans
  const prices = await fetchAzurePricing({
    serviceName: "Azure App Service",
    armRegionName: location
  });

  // Fallback pricing for common dedicated plans
  const dedicatedPricing = {
    B1: 13.14,
    B2: 26.28,
    B3: 52.56,
    S1: 73.00,
    S2: 146.00,
    S3: 292.00,
    P1v2: 73.00,
    P2v2: 146.00,
    P3v2: 292.00,
    P1v3: 109.50,
    P2v3: 219.00,
    P3v3: 438.00
  };

  // Try to find actual price from API
  const appServicePrice = prices.find(
    (p) =>
      p.skuName && p.skuName.includes(skuName) &&
      p.meterName && !p.meterName.includes("Slot")
  );

  const hoursPerMonth = 730;
  let monthlyComputeCost;

  if (appServicePrice) {
    monthlyComputeCost = appServicePrice.retailPrice * hoursPerMonth;
  } else {
    monthlyComputeCost = dedicatedPricing[skuName] || 73.00; // Default to S1 price
  }

  // Storage Account for function (~$1/month for minimal usage)
  const storageCost = 1;
  // Application Insights (~$2.30/GB, estimate 1GB/month)
  const appInsightsCost = 2.30;

  const totalMonthlyCost = monthlyComputeCost + storageCost + appInsightsCost;

  return {
    resourceType: "Azure Function (Dedicated)",
    skuName: `${skuName} - ${osType}/${runtimeStack}`,
    monthlyEstimate: parseFloat(totalMonthlyCost.toFixed(2)),
    currency: "USD",
    note: `Dedicated App Service plan (${skuName}). Fixed cost regardless of executions. Includes storage + App Insights.`,
    breakdown: {
      plan: `Dedicated (${skuName})`,
      computeCost: parseFloat(monthlyComputeCost.toFixed(2)),
      storageCost: storageCost,
      appInsightsCost: appInsightsCost
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
