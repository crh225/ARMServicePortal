/**
 * Port Notify Action
 *
 * Notifies Port.io when a scaffolder task completes.
 * Handles Port's OAuth flow to get an access token.
 */
import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import fetch from 'node-fetch';

export interface PortNotifyConfig {
  clientId: string;
  clientSecret: string;
}

export function createPortNotifyAction(config: PortNotifyConfig) {
  return createTemplateAction<{
    runId: string;
    status: 'SUCCESS' | 'FAILURE';
    message?: string;
    link?: string;
  }>({
    id: 'port:notify',
    description: 'Notifies Port.io of scaffolder task completion',
    schema: {
      input: {
        type: 'object' as const,
        required: ['runId', 'status'],
        properties: {
          runId: {
            type: 'string' as const,
            title: 'Run ID',
            description: 'The Port action run ID',
          },
          status: {
            type: 'string' as const,
            enum: ['SUCCESS', 'FAILURE'],
            title: 'Status',
            description: 'The completion status',
          },
          message: {
            type: 'string' as const,
            title: 'Message',
            description: 'Log message to send to Port',
          },
          link: {
            type: 'string' as const,
            title: 'Link',
            description: 'Link to include in the response',
          },
        },
      },
    },
    async handler(ctx) {
      const { runId, status, message, link } = ctx.input;
      const { clientId, clientSecret } = config;

      if (!runId) {
        ctx.logger.info('No Port run ID provided, skipping notification');
        return;
      }

      ctx.logger.info(`Notifying Port of ${status} for run ${runId}`);

      try {
        // Get Port access token
        const tokenResponse = await fetch('https://api.port.io/v1/auth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId,
            clientSecret,
          }),
        });

        if (!tokenResponse.ok) {
          throw new Error(`Failed to get Port access token: ${tokenResponse.status}`);
        }

        const tokenData = await tokenResponse.json() as { accessToken: string };
        const accessToken = tokenData.accessToken;

        // Update the action run
        const body: Record<string, unknown> = {
          status,
        };

        if (message) {
          body.message = message;
        }

        if (link) {
          body.link = [link];
        }

        const patchResponse = await fetch(`https://api.port.io/v1/actions/runs/${runId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        });

        if (!patchResponse.ok) {
          const errorText = await patchResponse.text();
          throw new Error(`Failed to update Port run: ${patchResponse.status} - ${errorText}`);
        }

        ctx.logger.info(`Successfully notified Port of ${status}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        ctx.logger.error(`Failed to notify Port: ${errorMessage}`);
        // Don't throw - we don't want to fail the whole task just because Port notification failed
      }
    },
  });
}
