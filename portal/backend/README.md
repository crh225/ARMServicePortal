# ARM Service Portal Backend

Node/Express API built with Domain-Driven Design (DDD), CQRS, and MediatR patterns.

## Deployment

The backend runs on AKS (Azure Kubernetes Service) with the following infrastructure:

- **Argo Rollouts** — Blue-green deployments with automated pre/post analysis
- **Istio Service Mesh** — Traffic management, mTLS, observability
- **Redis** — Distributed caching and notification storage (deployed via Crossplane)
- **RabbitMQ** — Message queue for real-time notifications (deployed via Crossplane)
- **Azure Key Vault** — Secrets synced via CSI driver

### URLs
- Production: `https://portal-api.chrishouse.io`
- Preview (Canary): `https://portal-api-preview.chrishouse.io`

## Real-Time Notifications

The portal supports real-time notifications for GitHub events (workflow runs, PRs, etc.) using the following architecture:

```
GitHub Webhooks → Webhook Relay (AKS) → RabbitMQ → Backend API → SSE → Frontend
```

### Components

1. **Webhook Relay** (`functions/github-webhook-relay/`)
   - Standalone Express server deployed to AKS
   - Receives GitHub webhooks at `https://webhooks.chrishouse.io/api/webhooks/github`
   - Verifies webhook signatures
   - Transforms payloads into notifications
   - Publishes to RabbitMQ exchange `github-webhooks`

2. **RabbitMQ** (deployed via Crossplane)
   - Topic exchange for routing notifications
   - Durable queue `notifications` for message persistence
   - Management UI at `https://rabbit-xp1-dev.pr.chrishouse.io`

3. **Backend NotificationService** (`src/infrastructure/messaging/`)
   - Consumes messages from RabbitMQ queue
   - Stores notifications in Redis
   - Broadcasts to connected clients via Server-Sent Events (SSE)

4. **Frontend**
   - Connects to SSE endpoint `/api/notifications/live`
   - Displays toast notifications in real-time
   - Persists notification state in context

### Supported GitHub Events
- `workflow_run` — CI/CD workflow status
- `workflow_job` — Individual job status
- `check_run` — Check suite results
- `pull_request` — PR opened/closed/merged
- `push` — Code pushed to branches
- `deployment` / `deployment_status` — Deployment events

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
│       ├── Cache.js     # Redis cache with in-memory fallback
│       └── ...
│
├── controllers/         # Express route handlers
│
├── routes/              # Express route definitions
│
└── utils/               # Shared utilities
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
- `POST /api/webhooks/github` - GitHub webhook endpoint (legacy, use webhook-relay instead)

### Notifications
- `GET /api/notifications` - List all notifications
- `GET /api/notifications/live` - SSE endpoint for real-time notifications
- `GET /api/notifications/status` - Get notification service status
- `POST /api/notifications/:id/read` - Mark notification as read
- `POST /api/notifications/mark-all-read` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete a notification
- `DELETE /api/notifications` - Clear all notifications

### Feature Flags
- `GET /api/features` - List all feature flags
- `GET /api/features/:key` - Get a specific feature flag
- `GET /api/features/:key/enabled` - Check if a feature is enabled
- `POST /api/features/batch` - Check multiple features at once

### Health & Auth
- `GET /api/health` - Health check endpoint (used by K8s probes)
- `GET /api/auth/github` - Initiate GitHub OAuth login
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - Logout current user

## Environment Variables

### GitHub App Configuration
- `GITHUB_APP_ID` - GitHub App ID
- `GITHUB_INSTALLATION_ID` - Installation ID for the GitHub App
- `GITHUB_APP_PRIVATE_KEY` or `GITHUB_APP_PRIVATE_KEY_BASE64` - Private key for authentication
- `GITHUB_INFRA_OWNER` - GitHub user/org that owns the infrastructure repo
- `GITHUB_INFRA_REPO` - Infrastructure repository name

### GitHub OAuth Configuration
- `GH_OAUTH_CLIENT_ID` - GitHub OAuth App client ID
- `GH_OAUTH_CLIENT_SECRET` - GitHub OAuth App client secret
- `SESSION_SECRET` - Secret for session encryption
- `APP_URL` - Backend URL for OAuth callbacks (e.g., `https://portal-api.chrishouse.io`)

### Azure Configuration
- `AZURE_SUBSCRIPTION_ID` - Default Azure subscription ID
- `AZURE_TENANT_ID` - Azure tenant ID
- `AZURE_CLIENT_ID` - Service principal client ID
- `AZURE_CLIENT_SECRET` - Service principal secret

### Redis Configuration
- `REDIS_URL` - Redis connection URL (e.g., `redis://host:6379`)
- `REDIS_HOST` - Redis server hostname (default: `localhost`, used if REDIS_URL not set)
- `REDIS_PORT` - Redis server port (default: `6379`)
- `REDIS_PASSWORD` - Redis authentication password

### RabbitMQ Configuration
- `RABBITMQ_URL` - AMQP connection URL (e.g., `amqp://user:pass@host:5672`)

### Azure App Configuration (Feature Flags)
- `AZURE_APPCONFIG_ENDPOINT` - App Configuration endpoint (e.g., `https://appconfig-name.azconfig.io`)
- Uses Azure Workload Identity (no client secret needed when running in AKS)

## Feature Flags

The backend integrates with Azure App Configuration for runtime feature flag management. Feature flags can be toggled in Azure without redeploying the application.

### How It Works

1. **Azure App Configuration** stores feature flags with optional environment labels
2. **FeatureFlagService** connects using Azure Workload Identity (managed identity)
3. **Frontend** fetches flags via `/api/features/batch` endpoint
4. **Users** can override flags locally via the UI toggle (stored in localStorage)

### Architecture

```
Azure App Configuration
        │
        ▼ (Azure SDK + Workload Identity)
┌─────────────────────────────┐
│  FeatureFlagService         │
│  - Connects to App Config   │
│  - Caches flags (5 min TTL) │
│  - Falls back to defaults   │
└─────────────────────────────┘
        │
        ▼ (MediatR pipeline)
┌─────────────────────────────┐
│  Feature Flag Controller    │
│  /api/features/*            │
└─────────────────────────────┘
        │
        ▼ (HTTP)
┌─────────────────────────────┐
│  Frontend                   │
│  useFeatureFlag() hook      │
│  FeaturePreferencesContext  │
└─────────────────────────────┘
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/features` | GET | List all feature flags |
| `/api/features/:key` | GET | Get a specific flag |
| `/api/features/:key/enabled` | GET | Check if enabled (with targeting) |
| `/api/features/batch` | POST | Check multiple flags at once |

### Current Feature Flags

| Flag Key | Description | Default |
|----------|-------------|---------|
| `notifications` | Show notification bell and toast popups | `true` |

### Backend Implementation

Located in `src/infrastructure/services/FeatureFlagService.js`:

```javascript
import { featureFlagService } from "../infrastructure/services/FeatureFlagService.js";

// Check if a feature is enabled
const isEnabled = await featureFlagService.isEnabled("notifications");

// Check with user context for targeting rules
const isEnabled = await featureFlagService.isEnabled("beta-feature", {
  userId: "user123",
  groups: ["beta-testers"]
});
```

### Caching

Feature flags are cached for 5 minutes to reduce Azure API calls:
- **Cache Key**: `featureflag:{key}`
- **TTL**: 5 minutes
- **Invalidation**: Automatic on TTL expiry

### Azure Setup

1. Create Azure App Configuration resource
2. Add feature flags under **Feature manager** in the portal
3. Grant the AKS pod identity **App Configuration Data Reader** role
4. Set `AZURE_APPCONFIG_ENDPOINT` environment variable

### Adding New Feature Flags

1. **Azure Portal**: Create flag in App Configuration → Feature manager
2. **Backend**: Flag will be auto-discovered via the API
3. **Frontend**: Use the `useFeatureFlag("new-flag")` hook

```javascript
// In React component
const myFeatureEnabled = useFeatureFlag("my-new-feature");

if (myFeatureEnabled) {
  return <NewFeatureComponent />;
}
```

## Caching

The backend uses Redis for distributed caching across pods. Cache is implemented with automatic fallback to in-memory storage if Redis is unavailable.

### Cache Implementation

Located in `src/infrastructure/utils/Cache.js`:

```javascript
import { cache } from "../utils/Cache.js";

// Get cached value
const cached = await cache.get("key");

// Set with TTL (milliseconds)
await cache.set("key", value, 60 * 60 * 1000); // 1 hour

// Delete
await cache.del("key");
```

### Cached Data & TTLs

| Data | Cache Key | TTL | Description |
|------|-----------|-----|-------------|
| Home Stats | `stats:home` | 12 hours | Dashboard statistics |
| Resource Groups | `resourceGroups:all` | 10 minutes | Azure Resource Graph results |
| PR Details | `pr:details:*` | 10 minutes | GitHub PR metadata |
| Backups | `backups:*` | 1 hour | Terraform state backups |

### Cache Behavior

- **Redis Connected**: Data shared across all pods, survives pod restarts
- **Redis Unavailable**: Falls back to in-memory cache (per-pod, lost on restart)
- **Startup**: Logs `[Cache] Initialized with Redis` or `[Cache] Initialized with in-memory fallback`

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
