/**
 * Azure Blob Backup Repository
 * Implements IBackupRepository using Azure Blob Storage
 * Uses RBAC authentication (Storage Blob Data Reader role) instead of storage account keys
 */
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
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
    // Use DefaultAzureCredential for RBAC-based authentication
    // Requires "Storage Blob Data Reader" role on the storage accounts
    this.credential = new DefaultAzureCredential();
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

    // Use DefaultAzureCredential directly with BlobServiceClient (RBAC authentication)
    // This requires "Storage Blob Data Reader" role instead of listKeys permission
    const blobServiceClient = new BlobServiceClient(accountUrl, this.credential);
    const containerClient = blobServiceClient.getContainerClient("tfstate");

    const backups = [];
    const backupPrefix = `${environment.value}/backups/`;

    // Fetch all blobs with the backup prefix, then sort and limit
    // Azure returns blobs in lexicographical order, but our filenames have timestamps
    // that sort correctly (e.g., backup-20250130-143022)
    const iterator = containerClient.listBlobsFlat({
      prefix: backupPrefix
    });

    // Collect all backups to sort properly
    const allBlobs = [];
    for await (const blob of iterator) {
      allBlobs.push(blob);
    }

    // Sort by name descending (newest first since timestamps are in filename)
    allBlobs.sort((a, b) => b.name.localeCompare(a.name));

    // Take only the requested limit
    const limitedBlobs = allBlobs.slice(0, limit);

    for (const blob of limitedBlobs) {
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

    return backups;
  }

  /**
   * Get backups for a specific environment
   */
  async getByEnvironment(environment, limit = 20) {
    const backups = await this.fetchEnvironmentBackups(environment, limit);
    // Sort by creation time (newest first)
    backups.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return backups;
  }

  /**
   * Get backups across all environments
   */
  async getAll(limit = 20) {
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
