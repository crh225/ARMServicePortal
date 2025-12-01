/**
 * Handler for GetResourcesQuery
 * Retrieves and enriches ARM Portal resources
 *
 * Strategy: Cache-first for unfiltered queries with costs
 * - Cache is populated on first request
 * - Unfiltered queries with costs serve from cache for instant response
 * - Filtered queries always fetch fresh (they're less common)
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";
import { cache } from "../../../infrastructure/utils/Cache.js";

const ENRICHED_RESOURCES_CACHE_KEY = "resources:enriched";
const ENRICHED_RESOURCES_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class GetResourcesHandler extends IRequestHandler {
  constructor(azureResourceService, resourceEnrichmentService) {
    super();
    this.azureResourceService = azureResourceService;
    this.resourceEnrichmentService = resourceEnrichmentService;
  }

  /**
   * Handle the GetResourcesQuery
   * @param {GetResourcesQuery} query
   * @returns {Promise<Result>} Resources with metadata
   */
  async handle(query) {
    try {
      const options = {};
      if (query.environment) options.environment = query.environment;
      if (query.blueprintId) options.blueprintId = query.blueprintId;
      if (query.resourceGroup) options.resourceGroup = query.resourceGroup;
      if (query.subscriptions) {
        options.subscriptions = query.subscriptions.split(",").map(s => s.trim());
      }

      const shouldIncludeCosts = query.includeCosts === 'true';

      if (query.skip) {
        const skipNum = parseInt(query.skip, 10);
        if (!isNaN(skipNum) && skipNum >= 0) {
          options.skip = skipNum;
        }
      }

      if (query.top) {
        const topNum = parseInt(query.top, 10);
        if (!isNaN(topNum) && topNum > 0 && topNum <= 1000) {
          options.top = topNum;
        }
      }

      // Check if this is an unfiltered query with costs (the common case for Resources page)
      const isUnfilteredWithCosts = !query.environment && !query.blueprintId &&
        !query.resourceGroup && !query.subscriptions &&
        !query.skip && !query.top && shouldIncludeCosts;

      // Try cache for unfiltered queries with costs
      if (isUnfilteredWithCosts) {
        const cached = await cache.get(ENRICHED_RESOURCES_CACHE_KEY);
        if (cached && cached.resources) {
          const age = Math.round((Date.now() - cached.timestamp) / 1000);
          console.log(`[Resources] Cache HIT (age: ${age}s, count: ${cached.resources.length})`);
          return Result.success({
            resources: cached.resources,
            count: cached.resources.length,
            skip: 0,
            top: 1000,
            cached: true,
            cachedAt: new Date(cached.timestamp).toISOString()
          });
        }
      }

      // Cache miss or filtered query - fetch fresh data
      console.log(`[Resources] ${isUnfilteredWithCosts ? 'Cache MISS' : 'Filtered query'} - fetching fresh data`);

      // Query Azure Resource Graph
      const resources = await this.azureResourceService.queryArmPortalResources(options);

      // Enrich with GitHub PR data and optionally costs (returns Resource entities)
      const enrichedResourceEntities = await this.resourceEnrichmentService.enrichResourcesWithPRs(
        resources,
        shouldIncludeCosts
      );

      // Convert Resource entities to DTOs for API response
      const enrichedResources = enrichedResourceEntities.map(resource => resource.toDTO());

      // Cache unfiltered results with costs
      if (isUnfilteredWithCosts) {
        await cache.set(ENRICHED_RESOURCES_CACHE_KEY, {
          resources: enrichedResources,
          timestamp: Date.now()
        }, ENRICHED_RESOURCES_CACHE_TTL);
        console.log(`[Resources] Cached ${enrichedResources.length} enriched resources`);
      }

      return Result.success({
        resources: enrichedResources,
        count: enrichedResources.length,
        skip: options.skip || 0,
        top: options.top || 1000,
        cached: false
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
