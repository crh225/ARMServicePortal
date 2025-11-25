/**
 * Webhooks Controller
 * Error handling, validation, and logging are handled by pipeline behaviors
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { ProcessGitHubWebhookCommand } from "../application/webhooks/commands/ProcessGitHubWebhookCommand.js";

/**
 * POST /api/webhooks/github
 * Handle GitHub workflow_run webhook events
 */
export function createGitHubWebhookHandler(mediator) {
  return asyncHandler(async (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const rawBody = req.rawBody;
    const event = req.headers['x-github-event'];

    if (!rawBody) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const command = new ProcessGitHubWebhookCommand({
      rawBody,
      signature,
      event,
      webhookData: req.body
    });
    const result = await mediator.send(command);
    return res.status(200).json(result);
  });
}
