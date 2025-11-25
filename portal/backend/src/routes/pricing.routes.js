/**
 * Pricing Routes 
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { createGetCostEstimateHandler } from "../controllers/pricing.controller.js";

const router = express.Router();

// Create handler with mediator
const getCostEstimateHandler = createGetCostEstimateHandler(mediator);

/**
 * POST /api/pricing/estimate
 * Get cost estimate for a blueprint configuration
 */
router.post("/estimate", getCostEstimateHandler);

export default router;
