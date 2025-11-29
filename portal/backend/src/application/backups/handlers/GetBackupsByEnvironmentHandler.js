/**
 * Handler for GetBackupsByEnvironmentQuery
 * Retrieves backups for a specific environment with caching
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Environment } from "../../../domain/value-objects/Environment.js";
import { Result } from "../../../domain/common/Result.js";

export class GetBackupsByEnvironmentHandler extends IRequestHandler {
  constructor(backupRepository, cache) {
    super();
    this.backupRepository = backupRepository;
    this.cache = cache;
    this.CACHE_TTL = 60 * 60 * 1000; // 1 hour
  }

  /**
   * Handle the GetBackupsByEnvironmentQuery
   * @param {GetBackupsByEnvironmentQuery} query
   * @returns {Promise<Result>} Response with environment backups
   */
  async handle(query) {
    try {
      // Validate and create Environment value object
      const environment = new Environment(query.environmentName);

      const cacheKey = `backups:${environment.value}-${query.limit}`;

      // Check cache
      const cached = await this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`[${environment.value}] backups from cache (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
        return Result.success(cached.data);
      }

      // Fetch from repository
      const backups = await this.backupRepository.getByEnvironment(environment, query.limit);

      // Convert entities to DTOs
      const backupDTOs = backups.map(backup => backup.toDTO());

      const response = {
        environment: environment.value,
        backups: backupDTOs,
        count: backupDTOs.length
      };

      // Cache the response
      await this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      }, this.CACHE_TTL);

      return Result.success(response);
    } catch (error) {
      return Result.failure(error);
    }
  }
}
