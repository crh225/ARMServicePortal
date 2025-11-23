/**
 * Backups Routes
 * Endpoints for managing Terraform state backups
 */

import express from "express";
import { getAllBackups, getBackupsByEnvironment } from "../controllers/backups.controller.js";

const router = express.Router();

/**
 * GET /api/backups
 * List all Terraform state backups across all environments
 * Query params: limit (default 10 per environment)
 */
router.get("/", getAllBackups);

/**
 * GET /api/backups/:environment
 * List Terraform state backups for a specific environment
 * Query params: limit (default 10)
 */
router.get("/:environment", getBackupsByEnvironment);

export default router;
