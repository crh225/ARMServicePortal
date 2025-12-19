import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Import logger FIRST to intercept console methods
import "./config/logger.js";

import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notificationService } from "./infrastructure/messaging/NotificationService.js";
import { notificationRepository } from "./infrastructure/di/mediatorContainer.js";

const app = express();

// Middleware
// Capture raw body for webhook signature verification
app.use(express.json({
  verify: (req, _res, buf, encoding) => {
    if (req.url.startsWith('/api/webhooks')) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }
}));
// Configure CORS to allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://portal.chrishouse.io',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

// Regex pattern for PR preview environments (e.g., https://portal-pr-123.pr.chrishouse.io)
const prEnvironmentPattern = /^https:\/\/portal-pr-\d+\.pr\.chrishouse\.io$/;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check static list of allowed origins
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Check if it's a PR preview environment
    if (prEnvironmentPattern.test(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(requestLogger);

// API Routes
app.use("/api", apiRoutes);

// Error handling (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`Backend listening on http://localhost:${PORT}`);

  // Initialize notification service for live updates via RabbitMQ
  try {
    await notificationService.initialize(notificationRepository, {
      exchange: process.env.RABBITMQ_EXCHANGE || "github-webhooks",
      queue: process.env.RABBITMQ_QUEUE || "notifications",
      routingPattern: "workflow.*"
    });
  } catch (error) {
    console.error("Failed to initialize notification service:", error.message);
    // Non-fatal - the backend can still function without live notifications
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  await notificationService.stop();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Received SIGINT, shutting down gracefully...");
  await notificationService.stop();
  process.exit(0);
});
