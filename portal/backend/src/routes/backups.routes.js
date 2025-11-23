import express from "express";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { StorageManagementClient } from "@azure/arm-storage";
import { ResourceGraphClient } from "@azure/arm-resourcegraph";

const router = express.Router();

// Cache for subscription ID
let cachedSubscriptionId = null;

// Storage account configurations for each environment
const STORAGE_ACCOUNTS = {
  dev: {
    name: "armportaltfstate9059",
    resourceGroup: "rg-armportal-tfstate-dev"
  },
  qa: {
    name: "armportaltfstateqa9059",
    resourceGroup: "rg-armportal-tfstate-qa"
  },
  staging: {
    name: "armportaltfstatestg9059",
    resourceGroup: "rg-armportal-tfstate-staging"
  },
  prod: {
    name: "armportaltfstateprod9059",
    resourceGroup: "rg-armportal-tfstate-prod"
  }
};

// Simple cache with 5 minute TTL
const backupsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get first accessible subscription ID
 */
async function getSubscriptionId(credential) {
  // Return cached value if available
  if (cachedSubscriptionId) {
    return cachedSubscriptionId;
  }

  // Check environment variables first
  const envSubscriptionId = process.env.ARM_SUBSCRIPTION_ID || process.env.AZURE_SUBSCRIPTION_ID;
  if (envSubscriptionId) {
    cachedSubscriptionId = envSubscriptionId;
    console.log(`[Backups] Using subscription from env: ${cachedSubscriptionId}`);
    return cachedSubscriptionId;
  }

  // Query Resource Graph for any resource to get subscription ID
  try {
    const resourceGraphClient = new ResourceGraphClient(credential);
    const query = {
      query: "Resources | project subscriptionId | limit 1"
    };
    const result = await resourceGraphClient.resources(query);

    if (result.data && result.data.length > 0) {
      cachedSubscriptionId = result.data[0].subscriptionId;
      console.log(`[Backups] Using subscription from Resource Graph: ${cachedSubscriptionId}`);
      return cachedSubscriptionId;
    }
  } catch (error) {
    console.error("[Backups] Failed to query subscription from Resource Graph:", error.message);
  }

  throw new Error("No accessible subscriptions found");
}

/**
 * Get storage account key
 */
async function getStorageAccountKey(accountName, resourceGroup, credential) {
  const subscriptionId = await getSubscriptionId(credential);
  const storageClient = new StorageManagementClient(credential, subscriptionId);

  const keys = await storageClient.storageAccounts.listKeys(resourceGroup, accountName);
  return keys.keys[0].value;
}

/**
 * Fetch backups for a single environment with limit
 */
async function fetchEnvironmentBackups(env, config, credential, limit = 10) {
  const accountUrl = `https://${config.name}.blob.core.windows.net`;
  console.log(`[Backups] Fetching backups for ${env} from ${accountUrl}`);

  // Get storage account key for authentication
  const accountKey = await getStorageAccountKey(config.name, config.resourceGroup, credential);
  const sharedKeyCredential = new StorageSharedKeyCredential(config.name, accountKey);

  const blobServiceClient = new BlobServiceClient(accountUrl, sharedKeyCredential);
  const containerClient = blobServiceClient.getContainerClient("tfstate");

  const backups = [];
  const backupPrefix = `${env}/backups/`;

  // Use maxPageSize to limit the number of results fetched
  const iterator = containerClient.listBlobsFlat({
    prefix: backupPrefix
  }).byPage({ maxPageSize: limit });

  // Only fetch first page for speed
  const page = await iterator.next();
  console.log(`[Backups] ${env}: page.done=${page.done}, has value=${!!page.value}`);

  if (!page.done && page.value) {
    console.log(`[Backups] ${env}: Found ${page.value.segment.blobItems?.length || 0} blobs`);
    for (const blob of page.value.segment.blobItems) {
      // Skip if this is the current state file (not a backup)
      if (blob.name === `${env}/terraform.tfstate`) {
        continue;
      }

      // Parse backup metadata from filename
      const filename = blob.name.split("/").pop();
      const backupMatch = filename.match(/terraform\.tfstate\.(backup|pre-restore)-(\d{8}-\d{6})(?:-([a-f0-9]+))?/);

      let backupType = "unknown";
      let timestamp = null;
      let gitSha = null;

      if (backupMatch) {
        backupType = backupMatch[1];
        timestamp = backupMatch[2];
        gitSha = backupMatch[3] || null;
      }

      backups.push({
        environment: env,
        name: filename,
        blobPath: blob.name,
        backupType,
        timestamp,
        gitSha,
        createdAt: blob.properties.createdOn,
        lastModified: blob.properties.lastModified,
        sizeBytes: blob.properties.contentLength,
        sizeMB: (blob.properties.contentLength / (1024 * 1024)).toFixed(2)
      });
    }
  }

  return backups;
}

/**
 * GET /api/backups
 * List all Terraform state backups across all environments
 * Query params: limit (default 10 per environment)
 */
router.get("/", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const cacheKey = `all-${limit}`;

    // Check cache
    const cached = backupsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Serving backups from cache (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
      return res.json(cached.data);
    }

    const credential = new DefaultAzureCredential();

    // Fetch all environments in parallel for speed
    const backupPromises = Object.entries(STORAGE_ACCOUNTS).map(([env, config]) =>
      fetchEnvironmentBackups(env, config, credential, limit)
        .catch(error => {
          console.error(`Error fetching backups for ${env}:`, error.message);
          return []; // Return empty array on error
        })
    );

    const results = await Promise.all(backupPromises);
    const allBackups = results.flat();

    // Sort by creation time (newest first)
    allBackups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Limit total results
    const limitedBackups = allBackups.slice(0, limit * 4);

    const response = {
      backups: limitedBackups,
      count: limitedBackups.length,
      totalCount: allBackups.length
    };

    // Cache the response
    backupsCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.json(response);
  } catch (error) {
    console.error("Error listing backups:", error);
    res.status(500).json({
      error: "Failed to list backups",
      details: error.message
    });
  }
});

/**
 * GET /api/backups/:environment
 * List Terraform state backups for a specific environment
 * Query params: limit (default 10)
 */
router.get("/:environment", async (req, res) => {
  const { environment } = req.params;
  const limit = parseInt(req.query.limit) || 10;

  if (!STORAGE_ACCOUNTS[environment]) {
    return res.status(400).json({
      error: "Invalid environment",
      validEnvironments: Object.keys(STORAGE_ACCOUNTS)
    });
  }

  try {
    const cacheKey = `${environment}-${limit}`;

    // Check cache
    const cached = backupsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[${environment}] backups from cache (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
      return res.json(cached.data);
    }

    const credential = new DefaultAzureCredential();
    const config = STORAGE_ACCOUNTS[environment];

    const backups = await fetchEnvironmentBackups(environment, config, credential, limit);

    // Sort by creation time (newest first)
    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const response = {
      environment,
      backups,
      count: backups.length
    };

    // Cache the response
    backupsCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.json(response);
  } catch (error) {
    console.error(`Error listing backups for ${environment}:`, error);
    res.status(500).json({
      error: `Failed to list backups for ${environment}`,
      details: error.message
    });
  }
});

export default router;
