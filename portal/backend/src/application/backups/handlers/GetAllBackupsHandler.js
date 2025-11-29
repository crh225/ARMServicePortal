/**
 * Handler for GetAllBackupsQuery
 * Retrieves backups across all environments with caching
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";

export class GetAllBackupsHandler extends IRequestHandler {
  constructor(backupRepository, cache) {
    super();
    this.backupRepository = backupRepository;
    this.cache = cache;
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Handle the GetAllBackupsQuery
   * @param {GetAllBackupsQuery} query
   * @returns {Promise<Result>} Response with backups and counts
   */
  async handle(query) {
    try {
      const cacheKey = `backups:all-${query.limit}`;

      // Check cache
      const cached = await this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        console.log(`Serving backups from cache (age: ${Math.round((Date.now() - cached.timestamp) / 1000)}s)`);
        return Result.success(cached.data);
      }

      // Fetch from repository
      const backups = await this.backupRepository.getAll(query.limit);

      // Convert entities to DTOs
      const backupDTOs = backups.map(backup => backup.toDTO());

      const response = {
        backups: backupDTOs,
        count: backupDTOs.length,
        totalCount: backupDTOs.length
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
