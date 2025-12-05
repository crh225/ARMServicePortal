/**
 * CatalogInfoRenderer - Generates Backstage catalog-info.yaml files for infrastructure resources
 *
 * This follows Backstage's standard entity format and industry best practices:
 * - Uses Backstage's Resource kind for infrastructure
 * - Includes proper ownership and lifecycle metadata
 * - Links to source infrastructure files
 * - Supports relationships (dependsOn, dependencyOf)
 * - Includes Azure-specific annotations for portal linking
 *
 * @see https://backstage.io/docs/features/software-catalog/descriptor-format
 */

/**
 * Map blueprint IDs to Azure resource types for proper categorization
 */
const AZURE_RESOURCE_TYPES = {
  'azure-rg-basic': 'azure-resource-group',
  'azure-storage-basic': 'azure-storage-account',
  'azure-key-vault-basic': 'azure-key-vault',
  'azure-postgres-flexible': 'azure-database-postgres',
  'azure-function': 'azure-function-app',
  'azure-container-instance': 'azure-container-instance',
  'azure-frontdoor': 'azure-frontdoor',
  'xp-building-blocks': 'kubernetes-application'
};

/**
 * Map environments to Backstage lifecycle stages
 */
const ENVIRONMENT_TO_LIFECYCLE = {
  'dev': 'development',
  'qa': 'development',
  'staging': 'pre-production',
  'prod': 'production'
};

/**
 * Map blueprint IDs to TechDocs URLs for centralized documentation
 */
const BLUEPRINT_DOCS_URLS = {
  'azure-rg-basic': 'url:https://github.com/crh225/ARMServicePortal/tree/main/docs',
  'azure-storage-basic': 'url:https://github.com/crh225/ARMServicePortal/tree/main/docs',
  'azure-key-vault-basic': 'url:https://github.com/crh225/ARMServicePortal/tree/main/docs',
  'azure-postgres-flexible': 'url:https://github.com/crh225/ARMServicePortal/tree/main/docs',
  'azure-function': 'url:https://github.com/crh225/ARMServicePortal/tree/main/docs',
  'azure-container-instance': 'url:https://github.com/crh225/ARMServicePortal/tree/main/docs',
  'xp-building-blocks': 'url:https://github.com/crh225/ARMServicePortal/tree/main/docs'
};

/**
 * Generate a valid Backstage entity name from module/claim name
 * Must be lowercase, alphanumeric with dashes, max 63 chars
 *
 * @param {string} name - Original name
 * @returns {string} - Valid entity name
 */
function toEntityName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 63);
}

/**
 * Generate a human-readable title from module name
 *
 * @param {string} moduleName - Module/claim name
 * @param {Object} blueprint - Blueprint configuration
 * @returns {string} - Human-readable title
 */
function generateTitle(moduleName, blueprint) {
  // Extract meaningful name (remove hash suffix)
  const baseName = moduleName.replace(/-[a-f0-9]{8}$/, '');
  return `${blueprint.displayName} - ${baseName}`;
}

/**
 * Get the Azure resource ID pattern for linking to Azure Portal
 *
 * @param {string} blueprintId - Blueprint ID
 * @param {Object} variables - Resource variables
 * @returns {string|null} - Azure resource ID pattern or null
 */
function getAzureResourceIdPattern(blueprintId, variables) {
  const patterns = {
    'azure-rg-basic': `/subscriptions/{subscriptionId}/resourceGroups/${variables.project_name}-${variables.environment}-rg`,
    'azure-storage-basic': `/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Storage/storageAccounts/${variables.storage_account_name || variables.project_name}`,
    'azure-key-vault-basic': `/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.KeyVault/vaults/${variables.key_vault_name || variables.project_name}`,
    'azure-postgres-flexible': `/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.DBforPostgreSQL/flexibleServers/${variables.server_name || variables.project_name}`,
    'azure-function': `/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.Web/sites/${variables.function_app_name || variables.project_name}`,
    'azure-container-instance': `/subscriptions/{subscriptionId}/resourceGroups/{resourceGroup}/providers/Microsoft.ContainerInstance/containerGroups/${variables.container_group_name || variables.project_name}`
  };

  return patterns[blueprintId] || null;
}

/**
 * Render a Backstage catalog-info.yaml for a Terraform resource
 *
 * @param {Object} options
 * @param {string} options.moduleName - Terraform module name
 * @param {Object} options.blueprint - Blueprint configuration
 * @param {Object} options.variables - Resource variables
 * @param {string} options.environment - Target environment
 * @param {string} options.createdBy - GitHub username of creator
 * @param {number} options.prNumber - PR number
 * @param {string} options.infraFilePath - Path to the .tf file
 * @returns {string} - YAML content
 */
export function renderTerraformCatalogInfo({
  moduleName,
  blueprint,
  variables,
  environment,
  createdBy,
  prNumber,
  infraFilePath
}) {
  const entityName = toEntityName(moduleName);
  const resourceType = AZURE_RESOURCE_TYPES[blueprint.id] || 'azure-resource';
  const lifecycle = ENVIRONMENT_TO_LIFECYCLE[environment] || 'development';

  const entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Resource',
    metadata: {
      name: entityName,
      title: generateTitle(moduleName, blueprint),
      description: `${blueprint.description || blueprint.displayName} provisioned via ARM Portal`,
      labels: {
        'armportal.chrishouse.io/blueprint': blueprint.id,
        'armportal.chrishouse.io/version': blueprint.version,
        'armportal.chrishouse.io/environment': environment,
        'armportal.chrishouse.io/provider': 'terraform'
      },
      annotations: {
        'backstage.io/managed-by-location': `url:https://github.com/crh225/ARMServicePortal/blob/main/${infraFilePath}`,
        'backstage.io/managed-by-origin-location': `url:https://github.com/crh225/ARMServicePortal/blob/main/${infraFilePath}`,
        'backstage.io/techdocs-ref': BLUEPRINT_DOCS_URLS[blueprint.id] || 'url:https://github.com/crh225/ARMServicePortal/tree/main/docs',
        'armportal.chrishouse.io/request-id': String(prNumber),
        'armportal.chrishouse.io/created-by': createdBy || 'unknown',
        'armportal.chrishouse.io/provisioned-at': new Date().toISOString(),
        'armportal.chrishouse.io/terraform-module': moduleName
      },
      tags: [
        'azure',
        'terraform',
        environment,
        blueprint.id.replace('azure-', '').replace('-basic', '')
      ],
      links: [
        {
          url: `https://github.com/crh225/ARMServicePortal/blob/main/${infraFilePath}`,
          title: 'Terraform Configuration',
          icon: 'code'
        },
        {
          url: `https://github.com/crh225/ARMServicePortal/pull/${prNumber}`,
          title: 'Provisioning PR',
          icon: 'github'
        }
      ]
    },
    spec: {
      type: resourceType,
      lifecycle: lifecycle,
      owner: createdBy ? `user:${createdBy}` : 'group:platform-team',
      system: `${variables.project_name || moduleName.split('-')[0]}-${environment}`
    }
  };

  // Add Azure Portal link if we can construct a resource ID
  const azureResourceId = getAzureResourceIdPattern(blueprint.id, variables);
  if (azureResourceId) {
    entity.metadata.annotations['azure.com/resource-id'] = azureResourceId;
    entity.metadata.links.push({
      url: `https://portal.azure.com/#@/resource${azureResourceId}`,
      title: 'Azure Portal',
      icon: 'cloud'
    });
  }

  // Add dependsOn for resources that depend on resource groups
  if (blueprint.id !== 'azure-rg-basic' && variables.resource_group_name) {
    const rgEntityName = toEntityName(variables.resource_group_name);
    entity.spec.dependsOn = [`resource:${rgEntityName}`];
  }

  return toYaml(entity);
}

/**
 * Render a Backstage catalog-info.yaml for a Crossplane claim
 *
 * @param {Object} options
 * @param {string} options.claimName - Crossplane claim name
 * @param {Object} options.blueprint - Blueprint configuration
 * @param {Object} options.variables - Claim parameters
 * @param {string} options.environment - Target environment
 * @param {string} options.createdBy - GitHub username of creator
 * @param {number} options.prNumber - PR number
 * @param {string} options.infraFilePath - Path to the claims.yaml file
 * @returns {string} - YAML content
 */
export function renderCrossplaneCatalogInfo({
  claimName,
  blueprint,
  variables,
  environment,
  createdBy,
  prNumber,
  infraFilePath
}) {
  const entityName = toEntityName(claimName);
  const resourceType = AZURE_RESOURCE_TYPES[blueprint.id] || 'kubernetes-resource';
  const lifecycle = ENVIRONMENT_TO_LIFECYCLE[environment] || 'development';

  const entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Resource',
    metadata: {
      name: entityName,
      title: generateTitle(claimName, blueprint),
      description: `${blueprint.description || blueprint.displayName} provisioned via ARM Portal (Crossplane)`,
      labels: {
        'armportal.chrishouse.io/blueprint': blueprint.id,
        'armportal.chrishouse.io/version': blueprint.version,
        'armportal.chrishouse.io/environment': environment,
        'armportal.chrishouse.io/provider': 'crossplane'
      },
      annotations: {
        'backstage.io/managed-by-location': `url:https://github.com/crh225/ARMServicePortal/blob/main/${infraFilePath}`,
        'backstage.io/managed-by-origin-location': `url:https://github.com/crh225/ARMServicePortal/blob/main/${infraFilePath}`,
        'backstage.io/techdocs-ref': BLUEPRINT_DOCS_URLS[blueprint.id] || 'url:https://github.com/crh225/ARMServicePortal/tree/main/docs',
        'armportal.chrishouse.io/request-id': String(prNumber),
        'armportal.chrishouse.io/created-by': createdBy || 'unknown',
        'armportal.chrishouse.io/provisioned-at': new Date().toISOString(),
        'armportal.chrishouse.io/crossplane-claim': claimName,
        'armportal.chrishouse.io/crossplane-kind': blueprint.crossplane?.kind || 'Unknown',
        'backstage.io/kubernetes-id': claimName,
        'backstage.io/kubernetes-namespace': blueprint.crossplane?.claimsNamespace || 'platform-claims'
      },
      tags: [
        'kubernetes',
        'crossplane',
        environment,
        blueprint.crossplane?.kind?.toLowerCase().replace('claim', '') || blueprint.id
      ],
      links: [
        {
          url: `https://github.com/crh225/ARMServicePortal/blob/main/${infraFilePath}`,
          title: 'Crossplane Claim',
          icon: 'code'
        },
        {
          url: `https://github.com/crh225/ARMServicePortal/pull/${prNumber}`,
          title: 'Provisioning PR',
          icon: 'github'
        }
      ]
    },
    spec: {
      type: resourceType,
      lifecycle: lifecycle,
      owner: createdBy ? `user:${createdBy}` : 'group:platform-team',
      system: `${variables.appName || claimName.split('-')[0]}-${environment}`
    }
  };

  return toYaml(entity);
}

/**
 * Render catalog-info.yaml for building blocks (multiple resources)
 *
 * @param {Object} options
 * @param {string} options.appName - Application name
 * @param {Object} options.blueprint - Blueprint configuration
 * @param {Object} options.variables - Application variables
 * @param {string} options.environment - Target environment
 * @param {string} options.createdBy - GitHub username of creator
 * @param {number} options.prNumber - PR number
 * @param {string} options.infraFilePath - Path to the claims.yaml file
 * @param {string[]} options.enabledComponents - List of enabled components
 * @returns {string} - Multi-document YAML content
 */
export function renderBuildingBlocksCatalogInfo({
  appName,
  blueprint,
  variables,
  environment,
  createdBy,
  prNumber,
  infraFilePath,
  enabledComponents
}) {
  const documents = [];
  const appEntityName = toEntityName(`${appName}-${environment}`);
  const lifecycle = ENVIRONMENT_TO_LIFECYCLE[environment] || 'development';

  // 1. Create a System entity for the application
  const systemEntity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'System',
    metadata: {
      name: appEntityName,
      title: `${appName} (${environment})`,
      description: `Full-stack application deployed via ARM Portal Building Blocks`,
      labels: {
        'armportal.chrishouse.io/blueprint': blueprint.id,
        'armportal.chrishouse.io/environment': environment,
        'armportal.chrishouse.io/provider': 'crossplane'
      },
      annotations: {
        'backstage.io/managed-by-location': `url:https://github.com/crh225/ARMServicePortal/blob/main/${infraFilePath}`,
        'backstage.io/managed-by-origin-location': `url:https://github.com/crh225/ARMServicePortal/blob/main/${infraFilePath}`,
        'armportal.chrishouse.io/request-id': String(prNumber),
        'armportal.chrishouse.io/created-by': createdBy || 'unknown',
        'armportal.chrishouse.io/provisioned-at': new Date().toISOString()
      },
      tags: ['kubernetes', 'crossplane', environment, 'building-blocks'],
      links: [
        {
          url: `https://github.com/crh225/ARMServicePortal/blob/main/${infraFilePath}`,
          title: 'Crossplane Claims',
          icon: 'code'
        },
        {
          url: `https://github.com/crh225/ARMServicePortal/pull/${prNumber}`,
          title: 'Provisioning PR',
          icon: 'github'
        }
      ]
    },
    spec: {
      owner: createdBy ? `user:${createdBy}` : 'group:platform-team'
    }
  };
  documents.push(toYaml(systemEntity));

  // 2. Create Resource entities for each component
  const componentTypeMap = {
    postgres: { type: 'database', suffix: '-db' },
    redis: { type: 'cache', suffix: '-cache' },
    rabbitmq: { type: 'message-queue', suffix: '-mq' },
    backend: { type: 'service', suffix: '-backend' },
    frontend: { type: 'website', suffix: '-frontend' },
    ingress: { type: 'ingress', suffix: '-ingress' }
  };

  for (const component of enabledComponents) {
    const componentConfig = componentTypeMap[component.toLowerCase()];
    if (!componentConfig) continue;

    const componentName = toEntityName(`${appName}${componentConfig.suffix}-${environment}`);

    const resourceEntity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Resource',
      metadata: {
        name: componentName,
        title: `${appName} ${component} (${environment})`,
        description: `${component} component for ${appName}`,
        labels: {
          'armportal.chrishouse.io/blueprint': blueprint.id,
          'armportal.chrishouse.io/component': component.toLowerCase(),
          'armportal.chrishouse.io/environment': environment
        },
        annotations: {
          'backstage.io/managed-by-location': `url:https://github.com/crh225/ARMServicePortal/blob/main/${infraFilePath}`,
          'backstage.io/managed-by-origin-location': `url:https://github.com/crh225/ARMServicePortal/blob/main/${infraFilePath}`,
          'backstage.io/kubernetes-id': `${appName}${componentConfig.suffix}`,
          'backstage.io/kubernetes-namespace': `${appName}-${environment}`
        },
        tags: ['kubernetes', 'crossplane', environment, component.toLowerCase()]
      },
      spec: {
        type: componentConfig.type,
        lifecycle: lifecycle,
        owner: createdBy ? `user:${createdBy}` : 'group:platform-team',
        system: appEntityName
      }
    };

    // Add dependencies between components
    const dependencies = [];
    if (component === 'backend' && enabledComponents.includes('postgres')) {
      dependencies.push(`resource:${toEntityName(`${appName}-db-${environment}`)}`);
    }
    if (component === 'backend' && enabledComponents.includes('redis')) {
      dependencies.push(`resource:${toEntityName(`${appName}-cache-${environment}`)}`);
    }
    if (component === 'backend' && enabledComponents.includes('rabbitmq')) {
      dependencies.push(`resource:${toEntityName(`${appName}-mq-${environment}`)}`);
    }
    if (component === 'frontend' && enabledComponents.includes('backend')) {
      dependencies.push(`resource:${toEntityName(`${appName}-backend-${environment}`)}`);
    }
    if (component === 'ingress') {
      if (enabledComponents.includes('frontend')) {
        dependencies.push(`resource:${toEntityName(`${appName}-frontend-${environment}`)}`);
      }
      if (enabledComponents.includes('backend')) {
        dependencies.push(`resource:${toEntityName(`${appName}-backend-${environment}`)}`);
      }
    }

    if (dependencies.length > 0) {
      resourceEntity.spec.dependsOn = dependencies;
    }

    documents.push(toYaml(resourceEntity));
  }

  return documents.join('\n---\n');
}

/**
 * Get the file path for catalog-info.yaml based on infrastructure path
 *
 * @param {string} infraFilePath - Path to the infrastructure file
 * @returns {string} - Path for catalog-info.yaml
 */
export function getCatalogInfoPath(infraFilePath) {
  // Place catalog-info.yaml alongside the infrastructure file
  const dir = infraFilePath.substring(0, infraFilePath.lastIndexOf('/'));
  const baseName = infraFilePath
    .substring(infraFilePath.lastIndexOf('/') + 1)
    .replace(/\.(tf|yaml)$/, '');

  // For Crossplane claims folders, put catalog-info.yaml in the same folder
  if (infraFilePath.includes('/crossplane/claims/')) {
    return `${dir}/catalog-info.yaml`;
  }

  // For Terraform, create a catalog folder structure
  return `${dir}/catalog/${baseName}.catalog-info.yaml`;
}

/**
 * Simple YAML serializer
 */
function toYaml(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  const lines = [];

  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'string') {
    if (needsQuoting(obj)) {
      return `"${escapeYamlString(obj)}"`;
    }
    return obj;
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        const itemYaml = toYaml(item, 0);
        const itemLines = itemYaml.split('\n');
        lines.push(`${spaces}- ${itemLines[0]}`);
        for (let i = 1; i < itemLines.length; i++) {
          lines.push(`${spaces}  ${itemLines[i]}`);
        }
      } else {
        lines.push(`${spaces}- ${toYaml(item, 0)}`);
      }
    }
    return lines.join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';

    for (const [key, value] of entries) {
      if (value === undefined) continue;

      if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) {
        lines.push(`${spaces}${key}:`);
        lines.push(toYaml(value, indent + 1));
      } else if (Array.isArray(value) && value.length > 0) {
        lines.push(`${spaces}${key}:`);
        lines.push(toYaml(value, indent + 1));
      } else if (Array.isArray(value) && value.length === 0) {
        lines.push(`${spaces}${key}: []`);
      } else if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) {
        lines.push(`${spaces}${key}: {}`);
      } else {
        lines.push(`${spaces}${key}: ${toYaml(value, 0)}`);
      }
    }
    return lines.join('\n');
  }

  return String(obj);
}

function needsQuoting(str) {
  const reserved = ['true', 'false', 'null', 'yes', 'no', 'on', 'off'];
  if (reserved.includes(str.toLowerCase())) return true;
  if (/^[0-9.-]+$/.test(str)) return true;
  if (/[:{}\[\],&*#?|\-<>=!%@`]/.test(str)) return true;
  if (str.includes('\n')) return true;
  if (str.startsWith(' ') || str.endsWith(' ')) return true;
  return false;
}

function escapeYamlString(str) {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n');
}
