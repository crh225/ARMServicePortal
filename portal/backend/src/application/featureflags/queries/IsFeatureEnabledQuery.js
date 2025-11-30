/**
 * Query to check if a feature is enabled
 */
import { IRequest } from "../../contracts/IRequest.js";

export class IsFeatureEnabledQuery extends IRequest {
  constructor(featureKey, context = {}) {
    super();
    this.featureKey = featureKey;
    this.context = context;
  }
}
