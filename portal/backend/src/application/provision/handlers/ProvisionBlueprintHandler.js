/**
 * Handler for ProvisionBlueprintCommand
 * Orchestrates blueprint provisioning with policy validation
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { ProvisionRequest } from "../../../domain/entities/ProvisionRequest.js";
import { BlueprintId } from "../../../domain/value-objects/BlueprintId.js";
import { Result } from "../../../domain/common/Result.js";

export class ProvisionBlueprintHandler extends IRequestHandler {
  constructor(blueprintRepository, policyService, gitHubProvisionService) {
    super();
    this.blueprintRepository = blueprintRepository;
    this.policyService = policyService;
    this.gitHubProvisionService = gitHubProvisionService;
  }

  /**
   * Handle the ProvisionBlueprintCommand
   * @param {ProvisionBlueprintCommand} command
   * @returns {Promise<Result>} Provision result
   */
  async handle(command) {
    try {
      // Validation
      if (!command.blueprintId || !command.variables) {
        return Result.validationFailure([
          { field: 'blueprintId', message: 'blueprintId is required' },
          { field: 'variables', message: 'variables are required' }
        ]);
      }

      // Create BlueprintId value object
      const blueprintId = new BlueprintId(command.blueprintId);

      // Get blueprint entity
      const blueprint = await this.blueprintRepository.getById(blueprintId, command.blueprintVersion);
      if (!blueprint) {
        const message = command.blueprintVersion
          ? `Unknown blueprint or version: ${command.blueprintId}@${command.blueprintVersion}`
          : `Unknown blueprintId: ${command.blueprintId}`;
        return Result.notFound(message);
      }

      // Create ProvisionRequest entity with business logic
      const provisionRequest = new ProvisionRequest({
        blueprintId: command.blueprintId,
        blueprintVersion: command.blueprintVersion,
        environment: command.environment,
        variables: command.variables,
        moduleName: command.moduleName,
        createdBy: command.createdBy,
        blueprint
      });

      // Validate environment support
      provisionRequest.validateEnvironment();

      // Validate required variables
      provisionRequest.validateRequiredVariables();

      // Validate policies (entity handles validation logic)
      provisionRequest.validatePolicies(this.policyService);

      // Apply auto-fill (entity handles logic)
      const finalVariables = provisionRequest.applyAutoFill(this.policyService);

      // Create GitHub request
      const gh = await this.gitHubProvisionService.createRequest({
        environment: provisionRequest.environment,
        blueprintId: provisionRequest.blueprintId,
        blueprintVersion: blueprint.version,
        variables: finalVariables,
        moduleName: provisionRequest.moduleName,
        createdBy: provisionRequest.createdBy
      });

      // Mark as submitted (entity handles state change)
      provisionRequest.markAsSubmitted(gh);

      return Result.success({
        ...provisionRequest.toResult(),
        entity: provisionRequest
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
