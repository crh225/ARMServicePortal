/**
 * Handler for GenerateTerraformCodeQuery
 * Generates Terraform import and resource configuration code from Azure resources
 */
import { IRequestHandler } from "../../contracts/IRequestHandler.js";
import { Result } from "../../../domain/common/Result.js";
import { generateTerraformCode } from "../../../infrastructure/terraform/TerraformCodeGenerator.js";

export class GenerateTerraformCodeHandler extends IRequestHandler {
  constructor(azureResourceService) {
    super();
    this.azureResourceService = azureResourceService;
  }

  /**
   * Handle the GenerateTerraformCodeQuery
   * @param {GenerateTerraformCodeQuery} query
   * @returns {Promise<Result>} Terraform code generation result
   */
  async handle(query) {
    try {
      // Fetch the resource details from Azure
      const resource = await this.azureResourceService.getResourceById(query.resourceId);

      if (!resource) {
        return Result.notFound(`Azure resource not found: ${query.resourceId}`);
      }

      // Generate Terraform code
      const result = generateTerraformCode(resource, query.useModules);

      if (!result.success) {
        const error = new Error(result.error);
        error.status = 400;
        error.details = {
          supportedTypes: result.supportedTypes
        };
        return Result.failure(error);
      }

      return Result.success({
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: resource.type,
        tfResourceType: result.tfResourceType,
        tfResourceName: result.resourceName,
        code: result.code,
        importBlock: result.importBlock,
        resourceConfig: result.resourceConfig,
        notes: result.notes
      });
    } catch (error) {
      return Result.failure(error);
    }
  }
}
