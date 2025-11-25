import { IRequest } from "../../contracts/IRequest.js";

/**
 * Query to generate Terraform code for an Azure resource
 */
export class GenerateTerraformCodeQuery extends IRequest {
  constructor(resourceId, useModules = true) {
    super();
    this.resourceId = resourceId;
    this.useModules = useModules; // If true, use blueprint modules; if false, generate raw resources
  }
}
