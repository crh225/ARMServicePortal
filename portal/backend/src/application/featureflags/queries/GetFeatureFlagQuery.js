/**
 * Query to get a specific feature flag by key
 */
import { IRequest } from "../../contracts/IRequest.js";

export class GetFeatureFlagQuery extends IRequest {
  constructor(featureKey) {
    super();
    this.featureKey = featureKey;
  }
}
