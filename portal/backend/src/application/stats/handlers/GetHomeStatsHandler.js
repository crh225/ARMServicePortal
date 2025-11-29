/**
 * Handler for GetHomeStatsQuery
 * Returns cached homepage statistics (blueprint count, resource count, job count)
 * Cache TTL: 12 hours
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
      // Check Redis cache first
      const cached = await this.cache.get(CACHE_KEY);
      if (cached && cached.timestamp && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        console.log(`[HomeStats] Cache HIT (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
        return Result.success({
          ...cached.stats,
          cached: true,
          cachedAt: new Date(cached.timestamp).toISOString()
        });
      }

      // Fetch all stats in parallel
      const [blueprints, resources, jobs] = await Promise.all([
        this.blueprintRepository.getAllLatest().catch(() => []),
        this.azureResourceService.queryArmPortalResources({}).catch(() => []),
        this.jobRepository.getAll({}).catch(() => [])
      ]);

      const stats = {
        blueprints: Array.isArray(blueprints) ? blueprints.length : 0,
        resources: Array.isArray(resources) ? resources.length : 0,
        jobs: Array.isArray(jobs) ? jobs.length : 0
      };

      const now = Date.now();

      // Cache to Redis
      await this.cache.set(CACHE_KEY, {
        stats,
        timestamp: now
      }, CACHE_TTL_MS);
      console.log("[HomeStats] Cache MISS - fetched fresh data");

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
