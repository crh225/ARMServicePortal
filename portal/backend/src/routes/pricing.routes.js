import express from "express";
import { getCostEstimate } from "../controllers/pricing.controller.js";

const router = express.Router();

/**
 * POST /api/pricing/estimate
 * Get cost estimate for a blueprint configuration
 */
router.post("/estimate", getCostEstimate);

export default router;
