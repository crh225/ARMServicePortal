import express from "express";
import { promoteResource } from "../controllers/promote.controller.js";

const router = express.Router();

/**
 * POST /api/promote/:id
 * Promote a deployed resource to the next environment
 */
router.post("/:id", promoteResource);

export default router;
