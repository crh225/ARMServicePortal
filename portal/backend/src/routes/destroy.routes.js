import express from "express";
import { destroyResource } from "../controllers/destroy.controller.js";

const router = express.Router();

// POST /api/destroy/:id - Create destroy PR for a deployed resource
router.post("/:id", destroyResource);

export default router;
