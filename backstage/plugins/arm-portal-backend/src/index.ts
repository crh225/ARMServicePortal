/**
 * ARM Portal Scaffolder Module
 *
 * Provides custom scaffolder actions for provisioning Azure infrastructure
 * through the ARM Portal backend API.
 */
import { createBackendModule, coreServices } from '@backstage/backend-plugin-api';
import { scaffolderActionsExtensionPoint } from '@backstage/plugin-scaffolder-node/alpha';
import { createArmPortalProvisionAction } from './actions/provision';

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

        // Register the ARM Portal provision action
        scaffolder.addActions(createArmPortalProvisionAction(armPortalConfig));
      },
    });
  },
});

export default armPortalScaffolderModule;
