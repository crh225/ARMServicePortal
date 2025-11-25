import { IRequest } from "../../contracts/IRequest.js";

/**
 * Query to generate Terraform code for an Azure resource
 */
export class GenerateTerraformCodeQuery extends IRequest {
  constructor(resourceId) {
    super();
    this.resourceId = resourceId;
  }
}
