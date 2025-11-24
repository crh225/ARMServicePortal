/**
 * Jobs Routes 
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { createListJobsHandler, createGetJobByIdHandler } from "../controllers/jobs.controller.js";

const router = express.Router();

// Create handlers with mediator
const listJobsHandler = createListJobsHandler(mediator);
const getJobByIdHandler = createGetJobByIdHandler(mediator);

/**
 * GET /api/jobs
 * Lists all jobs (with optional environment filter)
 */
router.get("/", listJobsHandler);

/**
 * GET /api/jobs/:id
 * Gets details for a specific job
 */
router.get("/:id", getJobByIdHandler);

export default router;
