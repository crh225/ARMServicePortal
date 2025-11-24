/**
 * Query to get all backups across all environments
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetAllBackupsQuery extends IRequest {
  constructor(limit = 10) {
    super();
    this.limit = limit;
  }
}
