/**
 * Resources Routes
 * Endpoints for Azure Resource Graph queries
 */

import express from "express";
import { getResources, getResourcesByRequest } from "../controllers/resources.controller.js";

const router = express.Router();

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
