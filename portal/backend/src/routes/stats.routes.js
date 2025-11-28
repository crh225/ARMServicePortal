/**
 * Stats Routes
 * Provides cached homepage statistics
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { createGetHomeStatsHandler } from "../controllers/stats.controller.js";

const router = express.Router();

// Create handler with mediator
const getHomeStatsHandler = createGetHomeStatsHandler(mediator);

/**
 * GET /api/stats
 * Returns cached homepage statistics (blueprint count, resource count, job count)
 */
router.get("/", getHomeStatsHandler);

export default router;
