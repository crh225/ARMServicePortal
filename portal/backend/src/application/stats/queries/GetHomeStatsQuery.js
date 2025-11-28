/**
 * Query to get homepage stats (blueprint count, resource count, job count)
 * This is cached server-side for 12 hours to reduce API calls
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetHomeStatsQuery extends IRequest {
  constructor() {
    super();
  }
}
