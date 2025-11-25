/**
 * Command to process a GitHub webhook event
 */
import { IRequest } from "../../contracts/IRequest.js";

export class ProcessGitHubWebhookCommand extends IRequest {
  constructor({ rawBody, signature, event, webhookData }) {
    super();
    this.rawBody = rawBody;
    this.signature = signature;
    this.event = event;
    this.webhookData = webhookData;
  }
}
