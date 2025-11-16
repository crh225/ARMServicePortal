import express from "express";
import { getCatalog } from "../controllers/catalog.controller.js";

const router = express.Router();

/**
 * GET /api/catalog
 * Returns the list of available blueprints
 */
router.get("/", getCatalog);

export default router;
