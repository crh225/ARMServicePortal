/**
 * Policy Service Implementation
 * Wraps the existing policy engine for DDD architecture
 */
import { IPolicyService } from "../../domain/services/IPolicyService.js";
import { validatePolicies, applyAutoFill, validatePromotion } from "../external/PolicyEngine.js";

export class PolicyService extends IPolicyService {
  validatePolicies(request) {
    return validatePolicies(request);
  }

  applyAutoFill(variables, autoFilled) {
    return applyAutoFill(variables, autoFilled);
  }

  validatePromotion(sourceJob, targetEnvironment) {
    return validatePromotion(sourceJob, targetEnvironment);
  }
}
