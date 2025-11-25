/**
 * Resource Enrichment Service Interface
 * Defines contract for enriching resources with PR and cost data
 */
export class IResourceEnrichmentService {
  /**
   * Enrich resources with GitHub PR data and optionally cost information
   * @param {Array} resources - Resources to enrich
   * @param {boolean} includeCosts - Whether to fetch cost data
   * @returns {Promise<Array>} - Enriched resources
   */
  async enrichResourcesWithPRs(resources, includeCosts) {
    throw new Error("enrichResourcesWithPRs() must be implemented");
  }
}
