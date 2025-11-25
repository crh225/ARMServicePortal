/**
 * Azure Blob Backup Repository
 * Implements IBackupRepository using Azure Blob Storage
 */
import { DefaultAzureCredential } from "@azure/identity";
import { StorageManagementClient } from "@azure/arm-storage";
import { ResourceGraphClient } from "@azure/arm-resourcegraph";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { IBackupRepository } from "../../../domain/repositories/IBackupRepository.js";
import { Backup } from "../../../domain/entities/Backup.js";
import { Environment } from "../../../domain/value-objects/Environment.js";

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

export class AzureBlobBackupRepository extends IBackupRepository {
  constructor() {
    super();
    this.credential = new DefaultAzureCredential();
    this.cachedSubscriptionId = null;
  }

  /**
   * Get Azure subscription ID
   */
  async getSubscriptionId() {
    if (this.cachedSubscriptionId) {
      return this.cachedSubscriptionId;
    }

    const envSubscriptionId = process.env.ARM_SUBSCRIPTION_ID || process.env.AZURE_SUBSCRIPTION_ID;
    if (envSubscriptionId) {
      this.cachedSubscriptionId = envSubscriptionId;
      console.log(`[BackupRepository] Using subscription from env: ${this.cachedSubscriptionId}`);
      return this.cachedSubscriptionId;
    }

    try {
      const resourceGraphClient = new ResourceGraphClient(this.credential);
      const query = { query: "Resources | project subscriptionId | limit 1" };
      const result = await resourceGraphClient.resources(query);

      if (result.data && result.data.length > 0) {
        this.cachedSubscriptionId = result.data[0].subscriptionId;
        console.log(`[BackupRepository] Using subscription from Resource Graph: ${this.cachedSubscriptionId}`);
        return this.cachedSubscriptionId;
      }
    } catch (error) {
      console.error("[BackupRepository] Failed to query subscription from Resource Graph:", error.message);
    }

    throw new Error("No accessible subscriptions found");
  }

  /**
   * Get storage account key for authentication
   */
  async getStorageAccountKey(accountName, resourceGroup) {
    const subscriptionId = await this.getSubscriptionId();
    const storageClient = new StorageManagementClient(this.credential, subscriptionId);
    const keys = await storageClient.storageAccounts.listKeys(resourceGroup, accountName);
    return keys.keys[0].value;
  }

  /**
   * Fetch backups for a single environment
   */
  async fetchEnvironmentBackups(environment, limit = 10) {
    const config = STORAGE_ACCOUNTS[environment.value];
    if (!config) {
      throw new Error(`No storage account configuration for environment: ${environment.value}`);
    }

    const accountUrl = `https://${config.name}.blob.core.windows.net`;
    console.log(`[BackupRepository] Fetching backups for ${environment.value} from ${accountUrl}`);

    // Get storage account key for authentication
    const accountKey = await this.getStorageAccountKey(config.name, config.resourceGroup);
    const sharedKeyCredential = new StorageSharedKeyCredential(config.name, accountKey);

    const blobServiceClient = new BlobServiceClient(accountUrl, sharedKeyCredential);
    const containerClient = blobServiceClient.getContainerClient("tfstate");

    const backups = [];
    const backupPrefix = `${environment.value}/backups/`;

    // Use maxPageSize to limit the number of results fetched
    const iterator = containerClient.listBlobsFlat({
      prefix: backupPrefix
    }).byPage({ maxPageSize: limit });

    // Only fetch first page for speed
    const page = await iterator.next();

    if (!page.done && page.value) {
      for (const blob of page.value.segment.blobItems) {
        // Skip if this is the current state file (not a backup)
        if (blob.name === `${environment.value}/terraform.tfstate`) {
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

        backups.push(new Backup({
          environment,
          name: filename,
          blobPath: blob.name,
          backupType,
          timestamp,
          gitSha,
          createdAt: blob.properties.createdOn,
          lastModified: blob.properties.lastModified,
          sizeBytes: blob.properties.contentLength
        }));
      }
    }

    return backups;
  }

  /**
   * Get backups for a specific environment
   */
  async getByEnvironment(environment, limit = 10) {
    const backups = await this.fetchEnvironmentBackups(environment, limit);
    // Sort by creation time (newest first)
    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return backups;
  }

  /**
   * Get backups across all environments
   */
  async getAll(limit = 10) {
    const environments = Environment.all();

    // Fetch backups from all environments in parallel
    const backupPromises = environments.map(env =>
      this.fetchEnvironmentBackups(env, limit)
        .catch(err => {
          console.error(`Error fetching backups for ${env.value}:`, err.message);
          return [];
        })
    );

    const results = await Promise.all(backupPromises);
    const allBackups = results.flat();

    // Sort by creation time (newest first)
    allBackups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return allBackups;
  }
}
