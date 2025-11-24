/**
 * Query to get backups for a specific environment
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetBackupsByEnvironmentQuery extends IRequest {
  constructor(environmentName, limit = 10) {
    super();
    this.environmentName = environmentName;
    this.limit = limit;
  }
}
