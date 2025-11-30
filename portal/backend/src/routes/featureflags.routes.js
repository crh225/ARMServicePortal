/**
 * Feature Flags Routes
 * API endpoints for feature flag management
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import {
  createGetAllFeatureFlagsHandler,
  createGetFeatureFlagHandler,
  createIsFeatureEnabledHandler,
  createBatchFeatureCheckHandler,
} from "../controllers/featureflags.controller.js";

const router = express.Router();

// Create handlers with mediator
const getAllFeatureFlagsHandler = createGetAllFeatureFlagsHandler(mediator);
const getFeatureFlagHandler = createGetFeatureFlagHandler(mediator);
const isFeatureEnabledHandler = createIsFeatureEnabledHandler(mediator);
const batchFeatureCheckHandler = createBatchFeatureCheckHandler(mediator);

/**
 * GET /api/features
 * Returns all feature flags
 */
router.get("/", getAllFeatureFlagsHandler);

/**
 * POST /api/features/batch
 * Check multiple features at once
 * Body: { features: ["feature1", "feature2"], context: { userId: "..." } }
 */
router.post("/batch", batchFeatureCheckHandler);

/**
 * GET /api/features/:key
 * Returns a specific feature flag
 */
router.get("/:key", getFeatureFlagHandler);

/**
 * GET /api/features/:key/enabled
 * Check if a feature is enabled
 * Query params: userId, groups (comma-separated), sessionId
 */
router.get("/:key/enabled", isFeatureEnabledHandler);

export default router;
