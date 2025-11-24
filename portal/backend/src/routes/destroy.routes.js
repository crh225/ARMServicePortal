/**
 * Destroy Routes 
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { createDestroyResourceHandler } from "../controllers/destroy.controller.js";

const router = express.Router();

// Create handler with mediator
const destroyResourceHandler = createDestroyResourceHandler(mediator);

// POST /api/destroy/:id - Create destroy PR for a deployed resource
router.post("/:id", destroyResourceHandler);

export default router;
