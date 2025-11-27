/**
 * Handler for GetContainerTagsQuery
 * Retrieves tags for a specific container repository
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetContainerTagsHandler extends IRequestHandler {
  constructor(containerRegistryRepository) {
    super();
    this.containerRegistryRepository = containerRegistryRepository;
  }

  async handle(query) {
    try {
      const { repositoryName } = query;
      const tags = await this.containerRegistryRepository.getTags(repositoryName);
      const registryHost = this.containerRegistryRepository.getRegistryHost();

      return Result.success({
        repository: repositoryName,
        registry: registryHost,
        tags: tags.map(tag => ({
          name: tag,
          fullImage: `${registryHost}/${repositoryName}:${tag}`
        }))
      });
    } catch (error) {
      console.error(`Failed to fetch tags for ${query.repositoryName}:`, error.message);
      return Result.failure(error);
    }
  }
}
