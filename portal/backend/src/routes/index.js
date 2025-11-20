import express from "express";
import healthRoutes from "./health.routes.js";
import catalogRoutes from "./catalog.routes.js";
import provisionRoutes from "./provision.routes.js";
import jobsRoutes from "./jobs.routes.js";
import destroyRoutes from "./destroy.routes.js";
import promoteRoutes from "./promote.routes.js";
import pricingRoutes from "./pricing.routes.js";
import authRoutes from "./auth.routes.js";
import resourcesRoutes from "./resources.routes.js";
import webhooksRoutes from "./webhooks.routes.js";
import notificationsRoutes from "./notifications.routes.js";

const router = express.Router();

// Mount all route modules
router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/catalog", catalogRoutes);
router.use("/provision", provisionRoutes);
router.use("/jobs", jobsRoutes);
router.use("/destroy", destroyRoutes);
router.use("/promote", promoteRoutes);
router.use("/pricing", pricingRoutes);
router.use("/resources", resourcesRoutes);
router.use("/webhooks", webhooksRoutes);
router.use("/notifications", notificationsRoutes);

export default router;
