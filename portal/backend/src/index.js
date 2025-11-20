import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

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
app.use(cors());
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
