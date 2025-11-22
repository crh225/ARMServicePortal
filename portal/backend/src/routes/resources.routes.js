/**
 * Resources Routes
 * Endpoints for Azure Resource Graph queries
 */

import express from "express";
import { getResources, getResourcesByRequest, getResourceGroups } from "../controllers/resources.controller.js";

const router = express.Router();

/**
 * GET /api/resource-groups
 * Get resource groups filtered by environment tag
 * Query params:
 *   - environment: Filter by environment tag (optional)
 * IMPORTANT: This route must come before /:requestId to avoid conflicts
 */
router.get("/resource-groups", getResourceGroups);

/**
 * GET /api/resources
 * Get all ARM Portal resources with GitHub enrichment
 * Query params:
 *   - environment: Filter by environment (optional)
 *   - blueprintId: Filter by blueprint (optional)
 *   - subscriptions: Comma-separated subscription IDs (optional)
 */
router.get("/", getResources);

/**
 * GET /api/resources/:requestId
 * Get resources for a specific request ID (PR number)
 * Used for graph visualization
 */
router.get("/:requestId", getResourcesByRequest);

export default router;
