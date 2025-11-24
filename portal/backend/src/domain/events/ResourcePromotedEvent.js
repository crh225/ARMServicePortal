import { IDomainEvent } from "./IDomainEvent.js";

export class ResourcePromotedEvent extends IDomainEvent {
  constructor(promotionRequest) {
    super();
    this.sourceJobId = promotionRequest.sourceJob.id;
    this.sourceEnvironment = promotionRequest.sourceJob.environment;
    this.targetEnvironment = promotionRequest.targetEnvironment;
    this.pullRequestUrl = promotionRequest.pullRequestUrl;
  }
}
