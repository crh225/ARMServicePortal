/**
 * Azure Container Registry Repository
 * Implements IContainerRegistryRepository using Azure Container Registry SDK
 */
import { DefaultAzureCredential } from "@azure/identity";
import { ContainerRegistryClient } from "@azure/container-registry";
import { IContainerRegistryRepository } from "../../../domain/repositories/IContainerRegistryRepository.js";

export class AzureContainerRegistryRepository extends IContainerRegistryRepository {
  constructor(registryUrl) {
    super();
    this.registryUrl = registryUrl || process.env.ACR_REGISTRY_URL || "https://armportalacre4k9.azurecr.io";
    this.registryHost = this.registryUrl.replace("https://", "").replace("http://", "");
    this.client = null;
  }

  /**
   * Get or create client lazily
   */
  getClient() {
    if (!this.client) {
      const credential = new DefaultAzureCredential();
      this.client = new ContainerRegistryClient(this.registryUrl, credential);
    }
    return this.client;
  }

  /**
   * Get all repositories in the registry
   */
  async getRepositories() {
    const client = this.getClient();
    const repositories = [];

    for await (const repo of client.listRepositoryNames()) {
      repositories.push(repo);
    }

    console.log(`Found ${repositories.length} repositories in ${this.registryHost}`);
    return repositories.sort();
  }

  /**
   * Get all tags for a specific repository
   */
  async getTags(repositoryName) {
    const client = this.getClient();
    const tags = [];

    try {
      const repository = client.getRepository(repositoryName);
      for await (const manifest of repository.listManifestProperties()) {
        if (manifest.tags && manifest.tags.length > 0) {
          tags.push(...manifest.tags);
        }
      }
    } catch (error) {
      console.error(`Error fetching tags for ${repositoryName}:`, error.message);
      return [];
    }

    // Sort tags: latest first, then semver-like, then alphabetically
    return tags.sort((a, b) => {
      if (a === "latest") return -1;
      if (b === "latest") return 1;
      return b.localeCompare(a, undefined, { numeric: true });
    });
  }

  /**
   * Get full image reference for a repository and tag
   */
  getImageReference(repositoryName, tag = "latest") {
    return `${this.registryHost}/${repositoryName}:${tag}`;
  }

  /**
   * Get registry host (for frontend display)
   */
  getRegistryHost() {
    return this.registryHost;
  }
}
