import express from "express";
import { provisionBlueprint } from "../controllers/provision.controller.js";
import { requireAuth } from "../controllers/auth.controller.js";

const router = express.Router();

/**
 * POST /api/provision
 * Creates a new provisioning request
 */
router.post("/", requireAuth, provisionBlueprint);

export default router;
