import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { requireAuth } from "../controllers/auth.controller.js";
import { createProvisionBlueprintHandler } from "../controllers/provision.controller.js";

const router = express.Router();

// Create handler with mediator
const provisionBlueprintHandler = createProvisionBlueprintHandler(mediator);

/**
 * POST /api/provision
 * Creates a new provisioning request
 */
router.post("/", requireAuth, provisionBlueprintHandler);

export default router;
