/**
 * Resources Routes 
 * Endpoints for Azure Resource Graph queries
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import {
  createGetResourcesHandler,
  createGetResourcesByRequestHandler,
  createGetResourceGroupsHandler
} from "../controllers/resources.controller.js";

const router = express.Router();

// Create handlers with mediator
const getResourcesHandler = createGetResourcesHandler(mediator);
const getResourcesByRequestHandler = createGetResourcesByRequestHandler(mediator);
const getResourceGroupsHandler = createGetResourceGroupsHandler(mediator);

/**
 * GET /api/resource-groups
 * Get resource groups filtered by environment tag
 * IMPORTANT: This route must come before /:requestId to avoid conflicts
 */
router.get("/resource-groups", getResourceGroupsHandler);

/**
 * GET /api/resources
 * Get all ARM Portal resources with GitHub enrichment
 */
router.get("/", getResourcesHandler);

/**
 * GET /api/resources/:requestId
 * Get resources for a specific request ID (PR number)
 */
router.get("/:requestId", getResourcesByRequestHandler);

export default router;
