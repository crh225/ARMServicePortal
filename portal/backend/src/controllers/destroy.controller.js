import { createDestroyPR } from "../services/github/destroy.js";

/**
 * Create a destroy PR for a deployed resource
 */
export async function destroyResource(req, res) {
  const prNumber = Number(req.params.id);

  if (!Number.isInteger(prNumber)) {
    return res.status(400).json({
      error: "Invalid resource ID"
    });
  }

  try {
    const result = await createDestroyPR(prNumber);
    res.json({
      success: true,
      message: `Destroy PR created successfully`,
      pr: result
    });
  } catch (err) {
    console.error("Error in destroyResource controller:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      error: "Failed to create destroy PR",
      details: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
  }
}
