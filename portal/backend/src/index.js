import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(bodyParser.json());
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
