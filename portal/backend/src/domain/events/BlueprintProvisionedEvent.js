import { IDomainEvent } from "./IDomainEvent.js";

export class BlueprintProvisionedEvent extends IDomainEvent {
  constructor(provisionRequest) {
    super();
    this.blueprintId = provisionRequest.blueprintId;
    this.environment = provisionRequest.environment;
    this.pullRequestUrl = provisionRequest.pullRequestUrl;
    this.createdBy = provisionRequest.createdBy;
  }
}
