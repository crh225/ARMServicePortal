/**
 * Handler for GetContainerRepositoriesQuery
 * Retrieves all container repositories from the registry
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetContainerRepositoriesHandler extends IRequestHandler {
  constructor(containerRegistryRepository) {
    super();
    this.containerRegistryRepository = containerRegistryRepository;
  }

  async handle(query) {
    try {
      const repositories = await this.containerRegistryRepository.getRepositories();
      const registryHost = this.containerRegistryRepository.getRegistryHost();

      return Result.success({
        registry: registryHost,
        repositories: repositories.map(name => ({
          name,
          fullPath: `${registryHost}/${name}`
        }))
      });
    } catch (error) {
      console.error("Failed to fetch container repositories:", error.message);
      return Result.failure(error);
    }
  }
}
