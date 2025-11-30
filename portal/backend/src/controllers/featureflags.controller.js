/**
 * Feature Flags Controller
 * Handles HTTP requests for feature flag operations
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GetAllFeatureFlagsQuery } from "../application/featureflags/queries/GetAllFeatureFlagsQuery.js";
import { GetFeatureFlagQuery } from "../application/featureflags/queries/GetFeatureFlagQuery.js";
import { IsFeatureEnabledQuery } from "../application/featureflags/queries/IsFeatureEnabledQuery.js";

/**
 * GET /api/features
 * Get all feature flags
 */
export function createGetAllFeatureFlagsHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const query = new GetAllFeatureFlagsQuery();
    // Note: ExceptionHandlingBehavior unwraps Result objects,
    // so we get the value directly (or an exception on failure)
    const flags = await mediator.send(query);
    return res.json(flags);
  });
}

/**
 * GET /api/features/:key
 * Get a specific feature flag by key
 */
export function createGetFeatureFlagHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const { key } = req.params;
    const query = new GetFeatureFlagQuery(key);
    // Note: ExceptionHandlingBehavior unwraps Result objects
    const flag = await mediator.send(query);
    return res.json(flag);
  });
}

/**
 * GET /api/features/:key/enabled
 * Check if a feature is enabled
 */
export function createIsFeatureEnabledHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const { key } = req.params;
    // Context can be passed via query params (userId, groups, etc.)
    const context = {
      userId: req.query.userId,
      groups: req.query.groups ? req.query.groups.split(",") : undefined,
      sessionId: req.query.sessionId,
    };

    const query = new IsFeatureEnabledQuery(key, context);
    // Note: ExceptionHandlingBehavior unwraps Result objects
    const result = await mediator.send(query);
    return res.json(result);
  });
}

/**
 * POST /api/features/batch
 * Check multiple features at once
 */
export function createBatchFeatureCheckHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const { features, context = {} } = req.body;

    if (!features || !Array.isArray(features)) {
      return res.status(400).json({
        error: "features array is required",
      });
    }

    const results = {};
    for (const featureKey of features) {
      const query = new IsFeatureEnabledQuery(featureKey, context);
      // Note: ExceptionHandlingBehavior unwraps Result objects,
      // so we get { featureKey, enabled } directly (or an exception on failure)
      try {
        const result = await mediator.send(query);
        results[featureKey] = result.enabled;
      } catch {
        // On error, default to disabled
        results[featureKey] = false;
      }
    }

    return res.json(results);
  });
}
