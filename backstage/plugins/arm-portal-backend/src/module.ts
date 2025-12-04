import { createBackendModule } from '@backstage/backend-plugin-api';
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
      },
      async init({ scaffolder }) {
        // Register the ARM Portal provision action
        scaffolder.addActions(createArmPortalProvisionAction());
      },
    });
  },
});
