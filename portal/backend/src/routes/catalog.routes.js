/**
 * Catalog Routes 
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { createGetCatalogHandler } from "../controllers/catalog.controller.js";

const router = express.Router();

const getCatalogHandler = createGetCatalogHandler(mediator);

/**
 * GET /api/catalog
 * Returns the list of available blueprints
 */
router.get("/", getCatalogHandler);

export default router;
