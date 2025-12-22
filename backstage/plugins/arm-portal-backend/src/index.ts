/**
 * ARM Portal Scaffolder Module
 *
 * Provides custom scaffolder actions for provisioning Azure infrastructure
 * through the ARM Portal backend API.
 */
import { createBackendModule, coreServices } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createArmPortalProvisionAction } from './actions/provision';
import { createGitHubSecretsAction } from './actions/github-secrets';
import { createArgoCdDeleteAction } from './actions/argocd-delete';
import { createCatalogUnregisterAction } from './actions/catalog-unregister';
import { createPortNotifyAction } from './actions/port-notify';
import { configureGitHubRepoAction } from './scaffolder/actions/configureGitHubRepo';

/**
 * Backend module that adds ARM Portal scaffolder actions
 */
export const armPortalScaffolderModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'arm-portal',
  register(reg) {
    reg.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        config: coreServices.rootConfig,
      },
      async init({ scaffolder, config }) {
        // Get ARM Portal configuration
        const armPortalConfig = {
          baseUrl: config.getOptionalString('armPortal.baseUrl') || 'http://localhost:4000',
          apiKey: config.getOptionalString('armPortal.apiKey') || '',
        };

        // Get GitHub token for secrets action (use gitops token or fall back to integration token)
        const githubIntegrations = config.getOptionalConfigArray('integrations.github') ?? [];
        const githubToken = githubIntegrations[0]?.getOptionalString('token') ?? '';
        const gitopsToken = config.getOptionalString('armPortal.gitopsToken') || githubToken;

        // Get Kubernetes config for ArgoCD delete action
        const k8sClusters = config.getOptionalConfigArray('kubernetes.clusterLocatorMethods') ?? [];
        const clusterConfig = k8sClusters[0]?.getOptionalConfigArray('clusters')?.[0];
        const k8sApiUrl = clusterConfig?.getOptionalString('url') || '';
        const k8sToken = config.getOptionalString('kubernetes.serviceAccountToken')
          || clusterConfig?.getOptionalString('serviceAccountToken')
          || process.env.K8S_SERVICE_ACCOUNT_TOKEN
          || '';

        // Register the ARM Portal provision action
        scaffolder.addActions(createArmPortalProvisionAction(armPortalConfig));

        // Register the GitHub secrets action
        scaffolder.addActions(createGitHubSecretsAction({
          token: githubToken,
          gitopsToken: gitopsToken,
        }));

        // Register the ArgoCD delete action
        scaffolder.addActions(createArgoCdDeleteAction({
          k8sApiUrl: k8sApiUrl,
          k8sToken: k8sToken,
          argoCdNamespace: 'argocd',
        }));

        // Register the catalog unregister action
        const backstageBaseUrl = config.getOptionalString('backend.baseUrl') || 'http://localhost:7007';
        // Get service token for internal API calls (use the external access token for Port)
        const serviceToken = process.env.PORT_BACKSTAGE_TOKEN || '';
        scaffolder.addActions(createCatalogUnregisterAction({
          baseUrl: backstageBaseUrl,
          token: serviceToken,
        }));

        // Register the Port notify action
        const portClientId = config.getOptionalString('port.clientId') || process.env.PORT_CLIENT_ID || '';
        const portClientSecret = config.getOptionalString('port.clientSecret') || process.env.PORT_CLIENT_SECRET || '';
        scaffolder.addActions(createPortNotifyAction({
          clientId: portClientId,
          clientSecret: portClientSecret,
        }));

        // Register the GitHub repository configuration action
        scaffolder.addActions(configureGitHubRepoAction({ token: githubToken }));
      },
    });
  },
});

export default armPortalScaffolderModule;
