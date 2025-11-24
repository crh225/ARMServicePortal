/**
 * Logs Routes 
 * Endpoints for fetching logs from Azure resources
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { createGetResourceLogsHandler } from "../controllers/logs.controller.js";

const router = express.Router();

// Create handler with mediator
const getResourceLogsHandler = createGetResourceLogsHandler(mediator);

/**
 * GET /api/logs
 * Fetch logs for a specific resource
 * Query params:
 *   - resourceId: Full Azure resource ID (required)
 *   - tail: Number of log lines (default: 100)
 *   - timeRange: Time range for logs, e.g., '1h', '24h' (default: '1h')
 */
router.get("/", getResourceLogsHandler);

export default router;
