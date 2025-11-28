/**
 * Handler for GetHomeStatsQuery
 * Returns cached homepage statistics (blueprint count, resource count, job count)
 * Cache TTL: 12 hours
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

// In-memory cache for home stats (12 hours TTL)
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
let cachedStats = null;
let cacheTimestamp = null;

export class GetHomeStatsHandler extends IRequestHandler {
  constructor(blueprintRepository, azureResourceService, jobRepository) {
    super();
    this.blueprintRepository = blueprintRepository;
    this.azureResourceService = azureResourceService;
    this.jobRepository = jobRepository;
  }

  /**
   * Handle the GetHomeStatsQuery
   * @param {GetHomeStatsQuery} query
   * @returns {Promise<Result>} Result containing stats object
   */
  async handle(query) {
    try {
      // Check if cache is still valid
      const now = Date.now();
      if (cachedStats && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL_MS) {
        return Result.success({
          ...cachedStats,
          cached: true,
          cachedAt: new Date(cacheTimestamp).toISOString()
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

      // Update cache
      cachedStats = stats;
      cacheTimestamp = now;

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
