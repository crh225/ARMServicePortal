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
    const result = await mediator.send(query);

    if (result.isFailure) {
      return res.status(result.error.status || 500).json({
        error: result.error.message,
      });
    }

    return res.json(result.value);
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
    const result = await mediator.send(query);

    if (result.isFailure) {
      return res.status(result.error.status || 500).json({
        error: result.error.message,
      });
    }

    return res.json(result.value);
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
    const result = await mediator.send(query);

    if (result.isFailure) {
      return res.status(result.error.status || 500).json({
        error: result.error.message,
      });
    }

    return res.json(result.value);
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
      const result = await mediator.send(query);
      results[featureKey] = result.isSuccess ? result.value.enabled : false;
    }

    return res.json(results);
  });
}
