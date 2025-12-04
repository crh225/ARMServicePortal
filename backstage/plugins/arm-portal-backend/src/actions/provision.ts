import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import fetch from 'node-fetch';

/**
 * ARM Portal Provision Action
 *
 * Calls the ARM Portal API to provision infrastructure based on blueprints.
 * This creates a GitHub PR with Terraform/Crossplane configuration.
 */
export function createArmPortalProvisionAction() {
  return createTemplateAction<{
    blueprintId: string;
    parameters: Record<string, unknown>;
  }>({
    id: 'arm-portal:provision',
    description: 'Provisions Azure infrastructure through ARM Portal',
    schema: {
      input: {
        type: 'object',
        required: ['blueprintId', 'parameters'],
        properties: {
          blueprintId: {
            type: 'string',
            title: 'Blueprint ID',
            description: 'The ID of the blueprint to provision',
          },
          parameters: {
            type: 'object',
            title: 'Parameters',
            description: 'Blueprint-specific parameters',
          },
        },
      },
      output: {
        type: 'object',
        properties: {
          jobId: {
            type: 'string',
            title: 'Job ID',
            description: 'The provisioning job ID',
          },
          jobUrl: {
            type: 'string',
            title: 'Job URL',
            description: 'URL to view the job status',
          },
          prUrl: {
            type: 'string',
            title: 'Pull Request URL',
            description: 'URL of the created pull request',
          },
          prNumber: {
            type: 'number',
            title: 'PR Number',
            description: 'Pull request number',
          },
        },
      },
    },
    async handler(ctx) {
      const { blueprintId, parameters } = ctx.input;

      ctx.logger.info(`Provisioning blueprint: ${blueprintId}`);
      ctx.logger.info(`Parameters: ${JSON.stringify(parameters, null, 2)}`);

      // ARM Portal API base URL - configured via app-config.yaml
      const armPortalUrl = process.env.ARM_PORTAL_URL || 'http://localhost:4000';

      try {
        // Call the ARM Portal provision API
        const response = await fetch(`${armPortalUrl}/api/provision`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            blueprintId,
            parameters,
            // Include user context from Backstage
            requestedBy: ctx.user?.ref || 'backstage-user',
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`ARM Portal API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json() as {
          jobId: string;
          prNumber: number;
          prUrl: string;
        };

        ctx.logger.info(`Provision request successful: Job ${result.jobId}`);

        // Set outputs for use in template
        ctx.output('jobId', result.jobId);
        ctx.output('jobUrl', `${armPortalUrl}/jobs/${result.jobId}`);
        ctx.output('prUrl', result.prUrl);
        ctx.output('prNumber', result.prNumber);

      } catch (error) {
        ctx.logger.error(`Failed to provision: ${error}`);
        throw error;
      }
    },
  });
}
