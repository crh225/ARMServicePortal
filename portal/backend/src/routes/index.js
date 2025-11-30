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
import logsRoutes from "./logs.routes.js";
import subscriptionsRoutes from "./subscriptions.routes.js";
import backupsRoutes from "./backups.routes.js";
import terraformRoutes from "./terraform.routes.js";
import registryRoutes from "./registry.routes.js";
import statsRoutes from "./stats.routes.js";
import adminRoutes from "./admin.routes.js";
import featureflagsRoutes from "./featureflags.routes.js";

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
router.use("/logs", logsRoutes);
router.use("/subscriptions", subscriptionsRoutes);
router.use("/backups", backupsRoutes);
router.use("/terraform", terraformRoutes);
router.use("/registry", registryRoutes);
router.use("/stats", statsRoutes);
router.use("/admin", adminRoutes);
router.use("/features", featureflagsRoutes);

export default router;
