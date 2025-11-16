import express from "express";
import healthRoutes from "./health.routes.js";
import catalogRoutes from "./catalog.routes.js";
import provisionRoutes from "./provision.routes.js";
import jobsRoutes from "./jobs.routes.js";

const router = express.Router();

// Mount all route modules
router.use("/health", healthRoutes);
router.use("/catalog", catalogRoutes);
router.use("/provision", provisionRoutes);
router.use("/jobs", jobsRoutes);

export default router;
