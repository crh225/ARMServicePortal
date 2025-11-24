/**
 * Backups Routes 
 * Endpoints for managing Terraform state backups
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { createGetAllBackupsHandler, createGetBackupsByEnvironmentHandler } from "../controllers/backups.controller.js";

const router = express.Router();

// Create handlers with mediator
const getAllBackupsHandler = createGetAllBackupsHandler(mediator);
const getBackupsByEnvironmentHandler = createGetBackupsByEnvironmentHandler(mediator);

/**
 * GET /api/backups
 * List all Terraform state backups across all environments
 * Query params: limit (default 10 per environment)
 */
router.get("/", getAllBackupsHandler);

/**
 * GET /api/backups/:environment
 * List Terraform state backups for a specific environment
 * Query params: limit (default 10)
 */
router.get("/:environment", getBackupsByEnvironmentHandler);

export default router;
