import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { createPromoteResourceHandler } from "../controllers/promote.controller.js";

const router = express.Router();

// Create handler with mediator
const promoteResourceHandler = createPromoteResourceHandler(mediator);

/**
 * POST /api/promote/:id
 * Promote a resource to the next environment
 */
router.post("/:id", promoteResourceHandler);

export default router;
