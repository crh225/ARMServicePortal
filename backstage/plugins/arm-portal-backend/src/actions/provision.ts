import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import fetch from 'node-fetch';

/**
 * ARM Portal configuration
 */
export interface ArmPortalConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * ARM Portal Provision Action
 *
 * Calls the ARM Portal API to provision infrastructure based on blueprints.
 * This creates a GitHub PR with Terraform/Crossplane configuration.
 */
export function createArmPortalProvisionAction(config: ArmPortalConfig) {
  return createTemplateAction({
    id: 'arm-portal:provision',
    description: 'Provisions Azure infrastructure through ARM Portal',
    schema: {
      input: {
        type: 'object' as const,
        required: ['blueprintId', 'parameters'],
        properties: {
          blueprintId: {
            type: 'string' as const,
            title: 'Blueprint ID',
            description: 'The ID of the blueprint to provision',
          },
          parameters: {
            type: 'object' as const,
            title: 'Parameters',
            description: 'Blueprint-specific parameters',
          },
        },
      },
      output: {
        type: 'object' as const,
        properties: {
          status: {
            type: 'string' as const,
            title: 'Status',
            description: 'The provisioning status',
          },
          prUrl: {
            type: 'string' as const,
            title: 'Pull Request URL',
            description: 'URL of the created pull request',
          },
          branchName: {
            type: 'string' as const,
            title: 'Branch Name',
            description: 'Git branch name for the PR',
          },
        },
      },
    },
    async handler(ctx) {
      // Debug: log full input to see what Backstage is passing
      ctx.logger.info(`Full ctx.input: ${JSON.stringify(ctx.input, null, 2)}`);

      const { blueprintId, parameters } = ctx.input as {
        blueprintId: string;
        parameters: Record<string, unknown>;
      };

      ctx.logger.info(`Provisioning blueprint: ${blueprintId}`);
      ctx.logger.info(`Parameters: ${JSON.stringify(parameters, null, 2)}`);

      // Use config from app-config.yaml
      const armPortalUrl = config.baseUrl;
      const apiKey = config.apiKey;

      if (!apiKey) {
        ctx.logger.warn('armPortal.apiKey not set in app-config.yaml - authentication may fail');
      }

      // Extract environment from parameters (ARM Portal expects it at top level)
      const { environment } = parameters as { environment?: string; [key: string]: unknown };

      try {
        // Call the ARM Portal provision API
        // ARM Portal expects: { blueprintId, environment, variables: {...} }
        const response = await fetch(`${armPortalUrl}/api/provision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey && { 'X-API-Key': apiKey }),
          },
          body: JSON.stringify({
            blueprintId,
            environment: environment || 'dev',
            variables: parameters, // Send all parameters as variables (ARM Portal also checks variables.environment)
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`ARM Portal API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json() as {
          status: string;
          pullRequestUrl: string;
          branchName: string;
          filePath: string;
          blueprintVersion: string;
        };

        ctx.logger.info(`Provision request successful: ${result.status}`);
        ctx.logger.info(`Pull Request: ${result.pullRequestUrl}`);

        // Set outputs for use in template
        ctx.output('status', result.status);
        ctx.output('prUrl', result.pullRequestUrl);
        ctx.output('branchName', result.branchName);

      } catch (error) {
        ctx.logger.error(`Failed to provision: ${error}`);
        throw error;
      }
    },
  });
}
