/**
 * Subscriptions Routes 
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { createGetAllSubscriptionsHandler } from "../controllers/subscriptions.controller.js";

const router = express.Router();

// Create handler with mediator
const getAllSubscriptionsHandler = createGetAllSubscriptionsHandler(mediator);

/**
 * GET /api/subscriptions
 * List all accessible Azure subscriptions
 */
router.get("/", getAllSubscriptionsHandler);

export default router;
