import {
  listGitHubRequests,
  getGitHubRequestByNumber
} from "../services/githubProvision.js";

/**
 * List all jobs with optional environment filter
 */
export async function listJobs(req, res) {
  try {
    const { environment } = req.query;
    const jobs = await listGitHubRequests({
      environment:
        typeof environment === "string" && environment.length > 0
          ? environment
          : undefined
    });

    res.json(jobs);
  } catch (err) {
    console.error("Error in listJobs controller:", err);
    res.status(500).json({
      error: "Failed to list jobs",
      details: err.message
    });
  }
}

/**
 * Get detailed information for a specific job
 */
export async function getJobById(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    return res.status(400).json({
      error: "Invalid job id"
    });
  }

  try {
    const job = await getGitHubRequestByNumber(id);
    res.json(job);
  } catch (err) {
    console.error("Error in getJobById controller:", err);
    if (err.status === 404) {
      return res.status(404).json({
        error: "Job not found"
      });
    }
    res.status(500).json({
      error: "Failed to fetch job",
      details: err.message
    });
  }
}
