import express from "express";
import crypto from "crypto";
import { addNotification } from "../controllers/notifications.controller.js";

const router = express.Router();

/**
 * Verify GitHub webhook signature
 * @param {string} payload - The raw request body as string
 * @param {string} signature - The X-Hub-Signature-256 header
 * @returns {boolean} True if signature is valid
 */
function verifyGitHubSignature(payload, signature) {
  if (!signature) {
    console.warn("No signature provided in webhook request");
    return false;
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error("GITHUB_WEBHOOK_SECRET not configured");
    return false;
  }

  const expectedSignature = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (e) {
    return false;
  }
}

/**
 * Parse PR number from workflow run details
 * @param {object} workflowRun - The workflow_run object from webhook
 * @returns {number|null} PR number or null if not found
 */
function parsePRNumber(workflowRun) {
  // Try to get PR number from head_branch (e.g., "requests/dev/azure-rg-basic-12345")
  const branchMatch = workflowRun.head_branch?.match(/requests\/[^/]+\/[^-]+-(\w+)$/);
  if (branchMatch) {
    // The last part is the hash, not PR number
    // Try to extract from PR associations
    const pr = workflowRun.pull_requests?.[0];
    if (pr) {
      return pr.number;
    }
  }

  // Try associated pull requests
  if (workflowRun.pull_requests && workflowRun.pull_requests.length > 0) {
    return workflowRun.pull_requests[0].number;
  }

  // Try from display title or head_commit message
  const titleMatch = workflowRun.display_title?.match(/#(\d+)/);
  if (titleMatch) {
    return parseInt(titleMatch[1], 10);
  }

  return null;
}

/**
 * Parse blueprint and environment from branch name
 * @param {string} branchName - The branch name
 * @returns {object} Object with environment and blueprint
 */
function parseBranchInfo(branchName) {
  // Expected format: requests/{env}/{blueprint}-{hash}
  const match = branchName?.match(/requests\/([^/]+)\/(.+)-(\w+)$/);
  if (match) {
    return {
      environment: match[1],
      blueprint: match[2]
    };
  }

  return {
    environment: 'unknown',
    blueprint: 'unknown'
  };
}

/**
 * POST /api/webhooks/github
 * Handle GitHub workflow_run webhook events
 */
router.post("/github", async (req, res) => {
  try {
    // Verify webhook signature using the raw body
    const signature = req.headers['x-hub-signature-256'];
    const payload = req.rawBody;

    if (!payload) {
      console.error("No raw body available for signature verification");
      return res.status(400).json({ error: "Invalid request body" });
    }

    const isValid = verifyGitHubSignature(payload, signature);

    if (!isValid) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const event = req.headers['x-github-event'];

    // Only handle workflow_run events
    if (event !== 'workflow_run') {
      console.log(`Ignoring webhook event: ${event}`);
      return res.status(200).json({ message: "Event type not handled" });
    }

    const { action, workflow_run } = req.body;

    // Only handle completed workflows
    if (action !== 'completed') {
      console.log(`Ignoring workflow_run action: ${action}`);
      return res.status(200).json({ message: "Action not handled" });
    }

    const conclusion = workflow_run.conclusion; // success, failure, cancelled, etc.
    const status = workflow_run.status; // completed

    console.log(`Workflow completed: ${workflow_run.name} - ${conclusion}`);

    // Parse job details
    const prNumber = parsePRNumber(workflow_run);
    const { environment, blueprint } = parseBranchInfo(workflow_run.head_branch);

    // Create notification based on conclusion
    let notificationType;
    let title;
    let message;

    if (conclusion === 'success') {
      notificationType = 'job_success';
      title = 'Deployment Succeeded';
      message = `${environment}/${blueprint}${prNumber ? ` (#${prNumber})` : ''} completed successfully`;
    } else if (conclusion === 'failure') {
      notificationType = 'job_failure';
      title = 'Deployment Failed';
      message = `${environment}/${blueprint}${prNumber ? ` (#${prNumber})` : ''} failed`;
    } else {
      // cancelled, skipped, etc.
      notificationType = 'job_info';
      title = 'Deployment Status';
      message = `${environment}/${blueprint}${prNumber ? ` (#${prNumber})` : ''} ${conclusion}`;
    }

    // Create notification
    const notification = addNotification({
      type: notificationType,
      title,
      message,
      prNumber,
      jobId: workflow_run.id.toString(),
      environment,
      blueprint,
      url: workflow_run.html_url
    });

    console.log(`Created notification: ${notification.id}`);

    res.status(200).json({
      message: "Webhook processed successfully",
      notificationId: notification.id
    });

  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({
      error: "Internal server error processing webhook",
      details: error.message
    });
  }
});

export default router;
