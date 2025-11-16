import express from "express";
import { listJobs, getJobById } from "../controllers/jobs.controller.js";

const router = express.Router();

/**
 * GET /api/jobs
 * Lists all jobs (with optional environment filter)
 */
router.get("/", listJobs);

/**
 * GET /api/jobs/:id
 * Gets details for a specific job
 */
router.get("/:id", getJobById);

export default router;
