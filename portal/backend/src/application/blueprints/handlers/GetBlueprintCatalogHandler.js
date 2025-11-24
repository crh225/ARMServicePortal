/**
 * Handler for GetBlueprintCatalogQuery
 * Retrieves all available blueprints in the catalog
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetBlueprintCatalogHandler extends IRequestHandler {
  constructor(blueprintRepository) {
    super();
    this.blueprintRepository = blueprintRepository;
  }

  /**
   * Handle the GetBlueprintCatalogQuery
   * @param {GetBlueprintCatalogQuery} query
   * @returns {Promise<Result>} Result containing public blueprint catalog
   */
  async handle(query) {
    try {
      const latestBlueprints = await this.blueprintRepository.getAllLatest();

      // Convert Blueprint entities to DTOs and add available versions
      const publicBlueprints = latestBlueprints.map((bp) => {
        const dto = bp.toDTO();
        const { moduleSource, ...rest } = dto;
        return {
          ...rest,
          availableVersions: this.blueprintRepository.getVersions(bp.id)
        };
      });

      return Result.success(publicBlueprints);
    } catch (error) {
      return Result.failure(error);
    }
  }
}
