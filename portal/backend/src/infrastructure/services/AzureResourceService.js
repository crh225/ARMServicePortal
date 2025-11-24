/**
 * Azure Resource Service Implementation
 * Wraps Azure Resource Graph queries for DDD architecture
 */
import { IAzureResourceService } from "../../domain/services/IAzureResourceService.js";
import { queryArmPortalResources, queryResourcesByRequestId, queryResourceGroupsByEnvironment } from "../external/AzureResourceGraphClient.js";

export class AzureResourceService extends IAzureResourceService {
  async queryArmPortalResources(options) {
    return await queryArmPortalResources(options);
  }

  async queryResourcesByRequestId(requestId) {
    return await queryResourcesByRequestId(requestId);
  }

  async queryResourceGroupsByEnvironment(environment) {
    return await queryResourceGroupsByEnvironment(environment);
  }
}
