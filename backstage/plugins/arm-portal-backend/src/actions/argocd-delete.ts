import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import fetch from 'node-fetch';
import * as https from 'https';

/**
 * ArgoCD Delete Configuration
 */
export interface ArgoCdDeleteConfig {
  k8sApiUrl: string;
  k8sToken: string;
  argoCdNamespace: string;
}

/**
 * ArgoCD Delete Application Action
 *
 * Deletes an ArgoCD Application resource directly via the Kubernetes API.
 * This bypasses ArgoCD's REST API auth issues by treating the Application
 * as a standard Kubernetes custom resource.
 */
export function createArgoCdDeleteAction(config: ArgoCdDeleteConfig) {
  return createTemplateAction({
    id: 'argocd:delete-app',
    description: 'Deletes an ArgoCD Application via Kubernetes API',
    schema: {
      input: {
        type: 'object' as const,
        required: ['appName'],
        properties: {
          appName: {
            type: 'string' as const,
            title: 'Application Name',
            description: 'The name of the ArgoCD application to delete',
          },
          cascade: {
            type: 'boolean' as const,
            title: 'Cascade Delete',
            description: 'Whether to delete child resources (default: true)',
            default: true,
          },
        },
      },
      output: {
        type: 'object' as const,
        properties: {
          deleted: {
            type: 'boolean' as const,
            title: 'Deleted',
            description: 'Whether the application was successfully deleted',
          },
          message: {
            type: 'string' as const,
            title: 'Message',
            description: 'Status message',
          },
        },
      },
    },
    async handler(ctx) {
      const { appName, cascade = true } = ctx.input as {
        appName: string;
        cascade?: boolean;
      };

      ctx.logger.info(`Deleting ArgoCD application: ${appName}`);
      ctx.logger.info(`Cascade delete: ${cascade}`);

      const { k8sApiUrl, k8sToken, argoCdNamespace } = config;

      if (!k8sToken) {
        throw new Error('K8S_SERVICE_ACCOUNT_TOKEN not configured');
      }

      // Create an agent that skips TLS verification (same as skipTLSVerify in k8s config)
      const agent = new https.Agent({
        rejectUnauthorized: false,
      });

      try {
        // First, check if the application exists
        const getUrl = `${k8sApiUrl}/apis/argoproj.io/v1alpha1/namespaces/${argoCdNamespace}/applications/${appName}`;

        ctx.logger.info(`Checking if application exists: ${getUrl}`);

        const getResponse = await fetch(getUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${k8sToken}`,
            'Content-Type': 'application/json',
          },
          agent,
        });

        if (getResponse.status === 404) {
          ctx.logger.info(`Application ${appName} not found - may already be deleted`);
          ctx.output('deleted', true);
          ctx.output('message', `Application ${appName} not found (may already be deleted)`);
          return;
        }

        if (!getResponse.ok) {
          const errorText = await getResponse.text();
          throw new Error(`Failed to check application: ${getResponse.status} - ${errorText}`);
        }

        // If cascade is true, set the finalizer removal and propagation policy
        // ArgoCD uses finalizers to manage cascade deletion
        const deleteUrl = `${k8sApiUrl}/apis/argoproj.io/v1alpha1/namespaces/${argoCdNamespace}/applications/${appName}`;

        // For cascade delete, we use the foreground propagation policy
        // This tells Kubernetes to delete dependent resources first
        const propagationPolicy = cascade ? 'Foreground' : 'Orphan';
        const deleteUrlWithParams = `${deleteUrl}?propagationPolicy=${propagationPolicy}`;

        ctx.logger.info(`Deleting application: ${deleteUrlWithParams}`);

        const deleteResponse = await fetch(deleteUrlWithParams, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${k8sToken}`,
            'Content-Type': 'application/json',
          },
          agent,
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          throw new Error(`Failed to delete application: ${deleteResponse.status} - ${errorText}`);
        }

        const result = await deleteResponse.json();
        ctx.logger.info(`Application ${appName} deletion initiated`);
        ctx.logger.info(`Delete response: ${JSON.stringify(result)}`);

        ctx.output('deleted', true);
        ctx.output('message', `Application ${appName} deleted successfully (cascade: ${cascade})`);

      } catch (error) {
        ctx.logger.error(`Failed to delete ArgoCD application: ${error}`);
        throw error;
      }
    },
  });
}
