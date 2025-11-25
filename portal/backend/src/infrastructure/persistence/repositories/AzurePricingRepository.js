/**
 * Azure Pricing Repository
 * Implements IPricingRepository using Azure Pricing service
 */
import { IPricingRepository } from "../../../domain/repositories/IPricingRepository.js";
import { estimateBlueprintCost } from "../../external/AzurePricingClient.js";

export class AzurePricingRepository extends IPricingRepository {
  /**
   * Estimate cost for a blueprint configuration
   */
  async estimateCost(blueprintId, variables, blueprint) {
    return await estimateBlueprintCost(blueprintId, variables, blueprint);
  }
}
