import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({ path: path.join(__dirname, "..", ".env") });

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { BLUEPRINTS, getBlueprintById } from "./config/blueprints.js";
import {   
  createGitHubRequest,
  listGitHubRequests,
  getGitHubRequestByNumber
 } from "./services/githubProvision.js";

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/catalog", (req, res) => {
  const publicBlueprints = BLUEPRINTS.map(({ moduleSource, ...rest }) => rest);
  res.json(publicBlueprints);
});

app.post("/api/provision", async (req, res) => {
  const { blueprintId, variables, environment } = req.body || {};
  if (!blueprintId || !variables) {
    return res.status(400).json({ error: "blueprintId and variables are required" });
  }

  const blueprint = getBlueprintById(blueprintId);
  if (!blueprint) {
    return res.status(404).json({ error: "Unknown blueprintId" });
  }

  const envValue = environment || variables.environment || "dev";

  try {
    const gh = await createGitHubRequest({
      environment: envValue,
      blueprintId,
      variables
    });

    return res.status(202).json({
      status: "submitted",
      pullRequestUrl: gh.pullRequestUrl,
      branchName: gh.branchName,
      filePath: gh.filePath
    });
  } catch (err) {
    console.error("Error in /api/provision:", err);
    return res.status(500).json({
      error: "Failed to create GitHub request",
      details: err.message
    });
  }
});

app.get("/api/jobs", async (req, res) => {
  try {
    const { environment } = req.query;
    const jobs = await listGitHubRequests({
      environment:
        typeof environment === "string" && environment.length > 0
          ? environment
          : undefined,
    });

    res.json(jobs);
  } catch (err) {
    console.error("Error in /api/jobs:", err);
    res.status(500).json({
      error: "Failed to list jobs",
      details: err.message,
    });
  }
});

app.get("/api/jobs/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Invalid job id" });
  }

  try {
    const job = await getGitHubRequestByNumber(id);
    res.json(job);
  } catch (err) {
    console.error("Error in /api/jobs/:id:", err);
    if (err.status === 404) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.status(500).json({
      error: "Failed to fetch job",
      details: err.message,
    });
  }
});


const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});