/**
 * Handler for GetHomeStatsQuery
 * Returns cached homepage statistics (blueprint count, resource count, job count)
 *
 * Strategy: Cache-first with background refresh
 * - Cache is pre-populated by cache-warmer CronJob (every 5 min)
 * - Handler always serves from cache for instant response
 * - Only fetches fresh data if cache is completely empty
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

const CACHE_KEY = "stats:home";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export class GetHomeStatsHandler extends IRequestHandler {
  constructor(blueprintRepository, azureResourceService, jobRepository, cache) {
    super();
    this.blueprintRepository = blueprintRepository;
    this.azureResourceService = azureResourceService;
    this.jobRepository = jobRepository;
    this.cache = cache;
  }

  /**
   * Handle the GetHomeStatsQuery
   * @param {GetHomeStatsQuery} query
   * @returns {Promise<Result>} Result containing stats object
   */
  async handle(query) {
    try {
      // Check Redis cache first - serve immediately if available (even if stale)
      // Cache is refreshed by cache-warmer CronJob every 5 minutes
      const cached = await this.cache.get(CACHE_KEY);
      if (cached && cached.stats) {
        const age = Math.round((Date.now() - cached.timestamp) / 1000);
        console.log(`[HomeStats] Cache HIT (age: ${age}s)`);
        return Result.success({
          ...cached.stats,
          cached: true,
          cachedAt: new Date(cached.timestamp).toISOString()
        });
      }

      // Cache empty - fetch fresh data (first request or Redis cleared)
      console.log("[HomeStats] Cache MISS - fetching fresh data");

      // Fetch all stats in parallel
      // Use getCount() for jobs - much faster (1 API call vs pagination)
      const [blueprints, resources, jobCountResult] = await Promise.all([
        this.blueprintRepository.getAllLatest().catch(() => []),
        this.azureResourceService.queryArmPortalResources({}).catch(() => []),
        this.jobRepository.getCount({}).catch(() => ({ isSuccess: false, value: 0 }))
      ]);

      // Extract job count from Result
      const jobCount = jobCountResult.isSuccess ? jobCountResult.value : 0;

      const stats = {
        blueprints: Array.isArray(blueprints) ? blueprints.length : 0,
        resources: Array.isArray(resources) ? resources.length : 0,
        jobs: jobCount
      };

      const now = Date.now();

      // Cache to Redis
      await this.cache.set(CACHE_KEY, {
        stats,
        timestamp: now
      }, CACHE_TTL_MS);

      return Result.success({
        ...stats,
        cached: false,
        cachedAt: new Date(now).toISOString()
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
