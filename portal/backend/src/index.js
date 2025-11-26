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

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
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
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
