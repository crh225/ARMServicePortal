# ARM Service Portal Backend

Node/Express API built with Domain-Driven Design (DDD), CQRS, and MediatR patterns.

## Architecture Patterns

### Domain-Driven Design (DDD)
The codebase is organized into three main layers:

- **Domain Layer** (`src/domain/`) - Core business logic and rules
  - Entities: Rich domain objects with business logic (Blueprint, Job, ProvisionRequest, etc.)
  - Value Objects: Immutable objects representing domain concepts (BlueprintId, Environment, JobId)
  - Repository Interfaces: Contracts for data access
  - Service Interfaces: Contracts for domain services
  - Domain Events: Events that represent significant business occurrences

- **Application Layer** (`src/application/`) - Use cases and orchestration
  - Commands: Write operations that change system state
  - Queries: Read operations that fetch data
  - Handlers: Execute commands and queries
  - Validators: Validate input before handlers execute

- **Infrastructure Layer** (`src/infrastructure/`) - Technical implementation details
  - Repositories: Concrete implementations of data access (Azure, GitHub, etc.)
  - Services: Concrete implementations of domain services
  - External Clients: Integration with external systems (Azure Resource Graph, GitHub API, etc.)
  - Behaviors: Cross-cutting concerns (logging, validation, exception handling)

### CQRS (Command Query Responsibility Segregation)
Separates read and write operations:

- **Commands** - Write operations that modify state
  - Example: `ProvisionBlueprintCommand`, `DestroyResourceCommand`
  - Handled by command handlers that enforce business rules

- **Queries** - Read operations that return data
  - Example: `GetResourcesQuery`, `GetBlueprintCatalogQuery`
  - Handled by query handlers that fetch and transform data

### MediatR Pattern
Central mediator routes requests to appropriate handlers:

- Request -> Mediator -> Handler
- Enables pipeline behaviors for cross-cutting concerns
- All requests flow through validation, logging, and exception handling
- Located in `src/infrastructure/mediator/Mediator.js`
- Configured in `src/infrastructure/di/mediatorContainer.js`

### Pipeline Behaviors
Executed in order for every request:

1. **ExceptionHandlingBehavior** - Catches and formats errors
2. **LoggingBehavior** - Logs request/response timing
3. **DomainEventBehavior** - Dispatches domain events after handler completes
4. **ValidationBehavior** - Validates requests before reaching handlers

### Result Pattern (Railway-Oriented Programming)
All handlers return `Result<T>` objects instead of throwing exceptions:

```javascript
// Success
return Result.success(data);

// Failure
return Result.failure(error);

// Not Found
return Result.notFound("Resource not found");

// Validation Failure
return Result.validationFailure([{ field: "name", message: "Required" }]);
```

Benefits:
- Explicit error handling
- Type-safe success/failure states
- No exceptions for expected failures
- Composable with `map`, `bind`, `onSuccess`, `onFailure`

### Repository Pattern
Abstracts data access behind interfaces:

- Domain layer defines interfaces (`IBackupRepository`, `IBlueprintRepository`)
- Infrastructure layer provides implementations
- Enables testing with mock repositories
- Supports multiple data sources (Azure, GitHub, In-Memory)

### Factory Pattern
Used for creating complex domain objects:

- Centralizes object creation logic
- Ensures invariants are maintained
- Located in repositories and entity constructors

## Project Structure

```
src/
├── application/           # Application layer - Use cases
│   ├── backups/          # Backup operations
│   ├── blueprints/       # Blueprint catalog and cost estimation
│   ├── destroy/          # Resource destruction
│   ├── jobs/             # Job tracking
│   ├── logs/             # Resource logs
│   ├── notification/     # Notification management
│   ├── promote/          # Environment promotion
│   ├── provision/        # Blueprint provisioning
│   ├── resources/        # Resource queries
│   ├── subscriptions/    # Subscription management
│   ├── terraform/        # Terraform code generation
│   └── webhooks/         # GitHub webhook processing
│
├── domain/               # Domain layer - Business logic
│   ├── entities/         # Rich domain entities
│   ├── events/           # Domain events
│   ├── repositories/     # Repository interfaces
│   ├── services/         # Service interfaces
│   ├── value-objects/    # Value objects
│   └── common/           # Shared domain concepts (Result)
│
├── infrastructure/       # Infrastructure layer - Technical details
│   ├── behaviors/        # Pipeline behaviors
│   ├── di/              # Dependency injection container
│   ├── events/          # Event dispatcher
│   ├── external/        # External service clients
│   ├── mediator/        # MediatR implementation
│   ├── persistence/     # Repository implementations
│   ├── services/        # Service implementations
│   └── utils/           # Infrastructure utilities
│
└── controllers/         # Express route handlers
```

## API Endpoints

### Blueprints
- `GET /api/catalog` - List available blueprints
- `POST /api/pricing/estimate` - Get cost estimate for blueprint

### Provisioning
- `POST /api/provision` - Provision blueprint (creates GitHub PR)
- `POST /api/promote/:prNumber` - Promote resource to production
- `POST /api/destroy/:prNumber` - Destroy provisioned resource

### Resources
- `GET /api/resources` - List all resources with enriched metadata
- `GET /api/resources/groups` - List resource groups
- `GET /api/logs` - Get resource logs

### Jobs & Workflows
- `GET /api/jobs` - List all provision/destroy jobs
- `GET /api/jobs/:id` - Get job details

### Subscriptions & Backups
- `GET /api/subscriptions` - List Azure subscriptions
- `GET /api/backups` - List Terraform state backups

### Terraform
- `POST /api/terraform/generate` - Generate Terraform import code for unmanaged resources

### Webhooks
- `POST /api/webhooks/github` - GitHub webhook endpoint

## Environment Variables

### GitHub App Configuration
- `GITHUB_APP_ID` - GitHub App ID
- `GITHUB_INSTALLATION_ID` - Installation ID for the GitHub App
- `GITHUB_APP_PRIVATE_KEY` or `GITHUB_APP_PRIVATE_KEY_BASE64` - Private key for authentication
- `GITHUB_INFRA_OWNER` - GitHub user/org that owns the infrastructure repo
- `GITHUB_INFRA_REPO` - Infrastructure repository name

### Azure Configuration
- `AZURE_SUBSCRIPTION_ID` - Default Azure subscription ID
- `AZURE_TENANT_ID` - Azure tenant ID
- `AZURE_CLIENT_ID` - Service principal client ID
- `AZURE_CLIENT_SECRET` - Service principal secret

## Run Locally

```bash
cd portal/backend
npm install
npm run dev
```

## Adding New Features

### 1. Create Domain Entities/Value Objects
Define your domain model in `src/domain/entities/` or `src/domain/value-objects/`

### 2. Define Repository Interface
Create interface in `src/domain/repositories/`

### 3. Create Command/Query
Add to `src/application/{feature}/commands/` or `queries/`

### 4. Implement Handler
Create handler in `src/application/{feature}/handlers/`

### 5. Add Validator (Optional)
Create validator in `src/application/{feature}/validators/`

### 6. Implement Repository
Add implementation in `src/infrastructure/persistence/repositories/`

### 7. Register with Mediator
Update `src/infrastructure/di/mediatorContainer.js`

### 8. Create Controller
Add Express route handler in `src/controllers/`

### 9. Register Routes
Update `src/routes/index.js`
