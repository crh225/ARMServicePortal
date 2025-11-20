/**
 * Logs API Routes
 * Endpoints for fetching logs from Azure resources
 */
import express from "express";
import { getResourceLogs } from "../services/logs/index.js";

const router = express.Router();

/**
 * GET /api/logs
 * Fetch logs for a specific resource
 * Query params:
 *   - resourceId: Full Azure resource ID (required)
 *   - tail: Number of log lines (default: 100)
 *   - timeRange: Time range for logs, e.g., '1h', '24h' (default: '1h')
 */
router.get("/", async (req, res) => {
  try {
    const { resourceId, tail, timeRange } = req.query;

    if (!resourceId) {
      return res.status(400).json({
        error: "Missing required parameter: resourceId"
      });
    }

    const tailNum = tail ? parseInt(tail, 10) : 100;
    if (isNaN(tailNum) || tailNum < 1 || tailNum > 1000) {
      return res.status(400).json({
        error: "tail must be a number between 1 and 1000"
      });
    }

    const logsData = await getResourceLogs(resourceId, {
      tail: tailNum,
      timeRange: timeRange || '1h'
    });

    res.json(logsData);

  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({
      error: "Failed to fetch logs",
      message: error.message
    });
  }
});

export default router;
