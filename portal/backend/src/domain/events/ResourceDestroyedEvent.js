import { IDomainEvent } from "./IDomainEvent.js";

export class ResourceDestroyedEvent extends IDomainEvent {
  constructor(jobId, pullRequestUrl) {
    super();
    this.jobId = jobId;
    this.pullRequestUrl = pullRequestUrl;
  }
}
