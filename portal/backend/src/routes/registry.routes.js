/**
 * Container Registry Routes
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { createGetRepositoriesHandler, createGetTagsHandler } from "../controllers/registry.controller.js";

const router = express.Router();

const getRepositoriesHandler = createGetRepositoriesHandler(mediator);
const getTagsHandler = createGetTagsHandler(mediator);

/**
 * GET /api/registry/repositories
 * Returns all repositories in the container registry
 */
router.get("/repositories", getRepositoriesHandler);

/**
 * GET /api/registry/repositories/:repositoryName/tags
 * Returns all tags for a specific repository
 */
router.get("/repositories/:repositoryName/tags", getTagsHandler);

export default router;
