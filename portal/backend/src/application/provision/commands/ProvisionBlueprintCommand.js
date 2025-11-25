/**
 * Command to provision a blueprint
 */
import { IRequest } from "../../contracts/IRequest.js";

export class ProvisionBlueprintCommand extends IRequest {
  constructor({ blueprintId, blueprintVersion, variables, environment, moduleName, createdBy }) {
    super();
    this.blueprintId = blueprintId;
    this.blueprintVersion = blueprintVersion;
    this.variables = variables;
    this.environment = environment;
    this.moduleName = moduleName;
    this.createdBy = createdBy;
  }
}
