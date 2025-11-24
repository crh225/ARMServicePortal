/**
 * Blueprint Repository
 * Implements IBlueprintRepository using config files
 */
import { IBlueprintRepository } from "../../../domain/repositories/IBlueprintRepository.js";
import { Blueprint } from "../../../domain/entities/Blueprint.js";
import { getBlueprintById, getLatestBlueprints, getBlueprintVersions } from "../../../config/blueprints.js";

export class BlueprintRepository extends IBlueprintRepository {
  /**
   * Get blueprint by ID and return as Blueprint entity
   */
  async getById(blueprintId) {
    const blueprintData = getBlueprintById(blueprintId.value);

    if (!blueprintData) {
      return null;
    }

    return new Blueprint({
      id: blueprintData.id,
      name: blueprintData.displayName || blueprintData.name,
      version: blueprintData.version,
      description: blueprintData.description,
      variables: blueprintData.variables,
      policies: blueprintData.policies,
      metadata: blueprintData.metadata
    });
  }

  /**
   * Get all latest blueprints as Blueprint entities
   */
  async getAllLatest() {
    const blueprintsData = getLatestBlueprints();

    return blueprintsData.map(data => new Blueprint({
      id: data.id,
      name: data.displayName || data.name,
      version: data.version,
      description: data.description,
      variables: data.variables,
      policies: data.policies,
      metadata: data.metadata
    }));
  }

  /**
   * Get available versions for a blueprint
   */
  async getVersions(blueprintId) {
    return getBlueprintVersions(blueprintId);
  }
}
