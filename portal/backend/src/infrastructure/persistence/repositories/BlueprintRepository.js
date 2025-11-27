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

    return this._toEntity(blueprintData);
  }

  /**
   * Get all latest blueprints as Blueprint entities
   */
  async getAllLatest() {
    const blueprintsData = getLatestBlueprints();
    return blueprintsData.map(data => this._toEntity(data));
  }

  /**
   * Convert raw blueprint data to Blueprint entity
   */
  _toEntity(data) {
    return new Blueprint({
      id: data.id,
      name: data.displayName || data.name,
      version: data.version,
      description: data.description,
      variables: data.variables,
      policies: data.policies,
      metadata: data.metadata,
      provider: data.provider,
      category: data.category,
      outputs: data.outputs,
      estimatedMonthlyCost: data.estimatedMonthlyCost,
      crossplane: data.crossplane
    });
  }

  /**
   * Get available versions for a blueprint
   */
  async getVersions(blueprintId) {
    return getBlueprintVersions(blueprintId);
  }
}
