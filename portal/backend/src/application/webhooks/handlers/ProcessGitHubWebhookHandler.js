/**
 * Handler for ProcessGitHubWebhookCommand
 * Handles GitHub workflow_run webhook events and creates notifications
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { WorkflowRun } from "../../../domain/entities/WorkflowRun.js";
import { Result } from "../../../domain/common/Result.js";

export class ProcessGitHubWebhookHandler extends IRequestHandler {
  constructor(signatureVerifier, notificationService) {
    super();
    this.signatureVerifier = signatureVerifier;
    this.notificationService = notificationService;
  }

  /**
   * Handle the ProcessGitHubWebhookCommand
   * @param {ProcessGitHubWebhookCommand} command
   * @returns {Result} Result with notification ID or error
   */
  handle(command) {
    try {
      // Verify webhook signature
      const isValid = this.signatureVerifier.verify(command.rawBody, command.signature);
      if (!isValid) {
        return Result.validationFailure([{ field: 'signature', message: 'Invalid webhook signature' }]);
      }

      // Only handle workflow_run events
      if (command.event !== 'workflow_run') {
        return Result.success({
          success: true,
          message: `Event type '${command.event}' not handled`
        });
      }

      const { action, workflow_run } = command.webhookData;

      // Only handle completed workflows
      if (action !== 'completed') {
        return Result.success({
          success: true,
          message: `Action '${action}' not handled`
        });
      }

      // Create WorkflowRun entity
      const workflowRun = new WorkflowRun({
        id: workflow_run.id,
        name: workflow_run.name,
        status: workflow_run.status,
        conclusion: workflow_run.conclusion,
        headBranch: workflow_run.head_branch,
        htmlUrl: workflow_run.html_url,
        displayTitle: workflow_run.display_title,
        pullRequests: workflow_run.pull_requests
      });

      console.log(`[ProcessGitHubWebhook] Workflow completed: ${workflowRun.name} - ${workflowRun.conclusion}`);

      // Parse job details from workflow run
      const prNumber = workflowRun.getPRNumber();
      const { environment, blueprint } = workflowRun.parseJobInfo();

      // Create notification using the notification service
      const notification = this.notificationService.addNotification({
        type: workflowRun.getNotificationType(),
        title: workflowRun.getNotificationTitle(),
        message: workflowRun.getNotificationMessage(),
        prNumber,
        jobId: workflowRun.id.toString(),
        environment,
        blueprint,
        url: workflowRun.htmlUrl
      });

      console.log(`[ProcessGitHubWebhook] Created notification: ${notification.id}`);

      return Result.success({
        success: true,
        message: "Webhook processed successfully",
        notificationId: notification.id
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
