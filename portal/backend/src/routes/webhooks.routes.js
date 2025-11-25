/**
 * Webhooks Routes 
 * Endpoints for handling GitHub webhook events
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { createGitHubWebhookHandler } from "../controllers/webhooks.controller.js";

const router = express.Router();

// Create handler with mediator
const gitHubWebhookHandler = createGitHubWebhookHandler(mediator);

/**
 * POST /api/webhooks/github
 * Handle GitHub workflow_run webhook events
 */
router.post("/github", gitHubWebhookHandler);

export default router;
