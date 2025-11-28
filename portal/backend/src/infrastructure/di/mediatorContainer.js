/**
 * MediatR-based Dependency Injection Container
 * Registers handlers with the mediator for CQRS pattern
 */
import { Mediator } from "../mediator/Mediator.js";

// Infrastructure - Repositories
import { AzureBlobBackupRepository } from "../persistence/repositories/AzureBlobBackupRepository.js";
import { AzureSubscriptionRepository } from "../persistence/repositories/AzureSubscriptionRepository.js";
import { BlueprintRepository } from "../persistence/repositories/BlueprintRepository.js";
import { AzurePricingRepository } from "../persistence/repositories/AzurePricingRepository.js";
import { GitHubJobRepository } from "../persistence/repositories/GitHubJobRepository.js";
import { GitHubDestroyRepository } from "../persistence/repositories/GitHubDestroyRepository.js";
import { AzureLogsRepository } from "../persistence/repositories/AzureLogsRepository.js";
import { InMemoryNotificationRepository } from "../persistence/repositories/InMemoryNotificationRepository.js";
import { AzureContainerRegistryRepository } from "../persistence/repositories/AzureContainerRegistryRepository.js";

// Infrastructure - Services
import { PolicyService } from "../services/PolicyService.js";
import { GitHubProvisionService } from "../services/GitHubProvisionService.js";
import { GitHubPromoteService } from "../services/GitHubPromoteService.js";
import { AzureResourceService } from "../services/AzureResourceService.js";
import { ResourceEnrichmentService } from "../services/ResourceEnrichmentService.js";
import { cache } from "../utils/Cache.js";

// Handlers
import { GetBlueprintCatalogHandler } from "../../application/blueprints/handlers/GetBlueprintCatalogHandler.js";
import { GetCostEstimateHandler } from "../../application/blueprints/handlers/GetCostEstimateHandler.js";
import { GetAllBackupsHandler } from "../../application/backups/handlers/GetAllBackupsHandler.js";
import { GetBackupsByEnvironmentHandler } from "../../application/backups/handlers/GetBackupsByEnvironmentHandler.js";
import { GetAllJobsHandler } from "../../application/jobs/handlers/GetAllJobsHandler.js";
import { GetJobByIdHandler } from "../../application/jobs/handlers/GetJobByIdHandler.js";
import { GetResourceLogsHandler } from "../../application/logs/handlers/GetResourceLogsHandler.js";
import { GetAllSubscriptionsHandler } from "../../application/subscriptions/handlers/GetAllSubscriptionsHandler.js";
import { ProvisionBlueprintHandler } from "../../application/provision/handlers/ProvisionBlueprintHandler.js";
import { PromoteResourceHandler } from "../../application/promote/handlers/PromoteResourceHandler.js";
import { DestroyResourceHandler } from "../../application/destroy/handlers/DestroyResourceHandler.js";
import { AddNotificationHandler } from "../../application/notification/handlers/AddNotificationHandler.js";
import { GetNotificationsHandler } from "../../application/notification/handlers/GetNotificationsHandler.js";
import { GetNotificationByIdHandler } from "../../application/notification/handlers/GetNotificationByIdHandler.js";
import { MarkNotificationAsReadHandler } from "../../application/notification/handlers/MarkNotificationAsReadHandler.js";
import { MarkAllNotificationsAsReadHandler } from "../../application/notification/handlers/MarkAllNotificationsAsReadHandler.js";
import { DeleteNotificationHandler } from "../../application/notification/handlers/DeleteNotificationHandler.js";
import { DeleteAllNotificationsHandler } from "../../application/notification/handlers/DeleteAllNotificationsHandler.js";
import { GetResourcesHandler } from "../../application/resources/handlers/GetResourcesHandler.js";
import { GetResourcesByRequestHandler } from "../../application/resources/handlers/GetResourcesByRequestHandler.js";
import { GetResourceGroupsHandler } from "../../application/resources/handlers/GetResourceGroupsHandler.js";
import { ProcessGitHubWebhookHandler } from "../../application/webhooks/handlers/ProcessGitHubWebhookHandler.js";
import { GenerateTerraformCodeHandler } from "../../application/terraform/handlers/GenerateTerraformCodeHandler.js";
import { GetContainerRepositoriesHandler } from "../../application/registry/handlers/GetContainerRepositoriesHandler.js";
import { GetContainerTagsHandler } from "../../application/registry/handlers/GetContainerTagsHandler.js";
import { GetHomeStatsHandler } from "../../application/stats/handlers/GetHomeStatsHandler.js";

// Queries & Commands
import { GetBlueprintCatalogQuery } from "../../application/blueprints/queries/GetBlueprintCatalogQuery.js";
import { GetCostEstimateQuery } from "../../application/blueprints/queries/GetCostEstimateQuery.js";
import { GetAllBackupsQuery } from "../../application/backups/queries/GetAllBackupsQuery.js";
import { GetBackupsByEnvironmentQuery } from "../../application/backups/queries/GetBackupsByEnvironmentQuery.js";
import { GetAllJobsQuery } from "../../application/jobs/queries/GetAllJobsQuery.js";
import { GetJobByIdQuery } from "../../application/jobs/queries/GetJobByIdQuery.js";
import { GetResourceLogsQuery } from "../../application/logs/queries/GetResourceLogsQuery.js";
import { GetAllSubscriptionsQuery } from "../../application/subscriptions/queries/GetAllSubscriptionsQuery.js";
import { GetNotificationsQuery } from "../../application/notification/queries/GetNotificationsQuery.js";
import { GetNotificationByIdQuery } from "../../application/notification/queries/GetNotificationByIdQuery.js";
import { GetResourcesQuery } from "../../application/resources/queries/GetResourcesQuery.js";
import { GetResourcesByRequestQuery } from "../../application/resources/queries/GetResourcesByRequestQuery.js";
import { GetResourceGroupsQuery } from "../../application/resources/queries/GetResourceGroupsQuery.js";
import { ProvisionBlueprintCommand } from "../../application/provision/commands/ProvisionBlueprintCommand.js";
import { PromoteResourceCommand } from "../../application/promote/commands/PromoteResourceCommand.js";
import { DestroyResourceCommand } from "../../application/destroy/commands/DestroyResourceCommand.js";
import { AddNotificationCommand } from "../../application/notification/commands/AddNotificationCommand.js";
import { MarkNotificationAsReadCommand } from "../../application/notification/commands/MarkNotificationAsReadCommand.js";
import { MarkAllNotificationsAsReadCommand } from "../../application/notification/commands/MarkAllNotificationsAsReadCommand.js";
import { DeleteNotificationCommand } from "../../application/notification/commands/DeleteNotificationCommand.js";
import { DeleteAllNotificationsCommand } from "../../application/notification/commands/DeleteAllNotificationsCommand.js";
import { ProcessGitHubWebhookCommand } from "../../application/webhooks/commands/ProcessGitHubWebhookCommand.js";
import { GenerateTerraformCodeQuery } from "../../application/terraform/queries/GenerateTerraformCodeQuery.js";
import { GetContainerRepositoriesQuery } from "../../application/registry/queries/GetContainerRepositoriesQuery.js";
import { GetContainerTagsQuery } from "../../application/registry/queries/GetContainerTagsQuery.js";
import { GetHomeStatsQuery } from "../../application/stats/queries/GetHomeStatsQuery.js";

// Pipeline Behaviors
import { ValidationBehavior } from "../behaviors/ValidationBehavior.js";
import { LoggingBehavior } from "../behaviors/LoggingBehavior.js";
import { ExceptionHandlingBehavior } from "../behaviors/ExceptionHandlingBehavior.js";
import { DomainEventBehavior } from "../behaviors/DomainEventBehavior.js";

// Domain Events
import { DomainEventDispatcher } from "../events/DomainEventDispatcher.js";

// Domain Event Handlers
import { BlueprintProvisionedEventHandler } from "../../application/events/handlers/BlueprintProvisionedEventHandler.js";
import { ResourcePromotedEventHandler } from "../../application/events/handlers/ResourcePromotedEventHandler.js";
import { ResourceDestroyedEventHandler } from "../../application/events/handlers/ResourceDestroyedEventHandler.js";

// Domain Events
import { BlueprintProvisionedEvent } from "../../domain/events/BlueprintProvisionedEvent.js";
import { ResourcePromotedEvent } from "../../domain/events/ResourcePromotedEvent.js";
import { ResourceDestroyedEvent } from "../../domain/events/ResourceDestroyedEvent.js";

// Validators
import { ProvisionBlueprintCommandValidator } from "../../application/provision/validators/ProvisionBlueprintCommandValidator.js";
import { PromoteResourceCommandValidator } from "../../application/promote/validators/PromoteResourceCommandValidator.js";
import { DestroyResourceCommandValidator } from "../../application/destroy/validators/DestroyResourceCommandValidator.js";
import { GenerateTerraformCodeQueryValidator } from "../../application/terraform/validators/GenerateTerraformCodeQueryValidator.js";

/**
 * Create and configure the mediator with all handlers
 * @returns {Mediator} Configured mediator instance
 */
export function createMediator() {
  const mediator = new Mediator();

  // Create domain event dispatcher
  const eventDispatcher = new DomainEventDispatcher();

  // Register domain event handlers
  eventDispatcher.register(
    BlueprintProvisionedEvent.name,
    () => new BlueprintProvisionedEventHandler()
  );

  eventDispatcher.register(
    ResourcePromotedEvent.name,
    () => new ResourcePromotedEventHandler()
  );

  eventDispatcher.register(
    ResourceDestroyedEvent.name,
    () => new ResourceDestroyedEventHandler()
  );

  // Configure pipeline behaviors (order matters!)
  // 1. Exception Handling - outermost, catches all errors
  // 2. Logging - logs all requests and responses
  // 3. Domain Events - dispatches domain events after handler completes
  // 4. Validation - validates requests before reaching handlers
  mediator.addBehavior(new ExceptionHandlingBehavior());
  mediator.addBehavior(new LoggingBehavior());
  mediator.addBehavior(new DomainEventBehavior(eventDispatcher));

  // Configure validators
  const validators = {
    ProvisionBlueprintCommand: new ProvisionBlueprintCommandValidator(),
    PromoteResourceCommand: new PromoteResourceCommandValidator(),
    DestroyResourceCommand: new DestroyResourceCommandValidator(),
    GenerateTerraformCodeQuery: new GenerateTerraformCodeQueryValidator(),
  };
  mediator.addBehavior(new ValidationBehavior(validators));

  // Create singleton repository instances
  const repos = {
    backup: new AzureBlobBackupRepository(),
    subscription: new AzureSubscriptionRepository(),
    blueprint: new BlueprintRepository(),
    pricing: new AzurePricingRepository(),
    job: new GitHubJobRepository(),
    destroy: new GitHubDestroyRepository(),
    logs: new AzureLogsRepository(),
    notification: new InMemoryNotificationRepository(),
    containerRegistry: new AzureContainerRegistryRepository(),
  };

  // Create singleton service instances
  const services = {
    policy: new PolicyService(),
    gitHubProvision: new GitHubProvisionService(),
    gitHubPromote: new GitHubPromoteService(),
    azureResource: new AzureResourceService(),
    resourceEnrichment: new ResourceEnrichmentService(),
  };

  // Handler registration configuration
  // Each entry: [RequestClass, HandlerClass, dependencies]
  const handlerConfig = [
    // Blueprint Queries
    [GetBlueprintCatalogQuery, GetBlueprintCatalogHandler, [repos.blueprint]],
    [GetCostEstimateQuery, GetCostEstimateHandler, [repos.blueprint, repos.pricing]],

    // Backup Queries
    [GetAllBackupsQuery, GetAllBackupsHandler, [repos.backup, cache]],
    [GetBackupsByEnvironmentQuery, GetBackupsByEnvironmentHandler, [repos.backup, cache]],

    // Job Queries
    [GetAllJobsQuery, GetAllJobsHandler, [repos.job]],
    [GetJobByIdQuery, GetJobByIdHandler, [repos.job]],

    // Logs Queries
    [GetResourceLogsQuery, GetResourceLogsHandler, [repos.logs]],

    // Subscription Queries
    [GetAllSubscriptionsQuery, GetAllSubscriptionsHandler, [repos.subscription]],

    // Notification Queries
    [GetNotificationsQuery, GetNotificationsHandler, [repos.notification]],
    [GetNotificationByIdQuery, GetNotificationByIdHandler, [repos.notification]],

    // Resource Queries
    [GetResourcesQuery, GetResourcesHandler, [services.azureResource, services.resourceEnrichment]],
    [GetResourcesByRequestQuery, GetResourcesByRequestHandler, [services.azureResource, services.resourceEnrichment]],
    [GetResourceGroupsQuery, GetResourceGroupsHandler, [services.azureResource]],

    // Terraform Queries
    [GenerateTerraformCodeQuery, GenerateTerraformCodeHandler, [services.azureResource]],

    // Registry Queries
    [GetContainerRepositoriesQuery, GetContainerRepositoriesHandler, [repos.containerRegistry]],
    [GetContainerTagsQuery, GetContainerTagsHandler, [repos.containerRegistry]],

    // Stats Queries
    [GetHomeStatsQuery, GetHomeStatsHandler, [repos.blueprint, services.azureResource, repos.job]],

    // Provision Commands
    [ProvisionBlueprintCommand, ProvisionBlueprintHandler, [repos.blueprint, services.policy, services.gitHubProvision]],

    // Promote Commands
    [PromoteResourceCommand, PromoteResourceHandler, [repos.job, services.policy, services.gitHubPromote]],

    // Destroy Commands
    [DestroyResourceCommand, DestroyResourceHandler, [repos.destroy]],

    // Notification Commands
    [AddNotificationCommand, AddNotificationHandler, [repos.notification]],
    [MarkNotificationAsReadCommand, MarkNotificationAsReadHandler, [repos.notification]],
    [MarkAllNotificationsAsReadCommand, MarkAllNotificationsAsReadHandler, [repos.notification]],
    [DeleteNotificationCommand, DeleteNotificationHandler, [repos.notification]],
    [DeleteAllNotificationsCommand, DeleteAllNotificationsHandler, [repos.notification]],

    // Webhook Commands
    [ProcessGitHubWebhookCommand, ProcessGitHubWebhookHandler, [repos.notification]],
  ];

  // Register all handlers
  handlerConfig.forEach(([RequestClass, HandlerClass, deps]) => {
    mediator.register(RequestClass.name, () => new HandlerClass(...deps));
  });

  return mediator;
}

// Export a singleton instance
export const mediator = createMediator();
