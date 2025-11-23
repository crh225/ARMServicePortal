import express from "express";
import { getSubscriptions } from "../controllers/subscriptions.controller.js";

const router = express.Router();

/**
 * GET /api/subscriptions
 * List all accessible Azure subscriptions
 */
router.get("/", getSubscriptions);

export default router;
