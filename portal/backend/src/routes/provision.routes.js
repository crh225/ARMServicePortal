import express from "express";
import { provisionBlueprint } from "../controllers/provision.controller.js";

const router = express.Router();

/**
 * POST /api/provision
 * Creates a new provisioning request
 */
router.post("/", provisionBlueprint);

export default router;
