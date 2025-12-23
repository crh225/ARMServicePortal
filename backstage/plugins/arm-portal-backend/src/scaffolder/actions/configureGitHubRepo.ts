import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Octokit } from '@octokit/rest';

/**
 * Custom Backstage action to configure GitHub repository settings
 * Automatically sets workflow permissions to 'write' to enable GHCR package publishing
 */
export const configureGitHubRepoAction = (options?: { token?: string }) => {
  return createTemplateAction<{
    repoUrl: string;
    token?: string;
  }>({
    id: 'armportal:github:configure-repo',
    description: 'Configures GitHub repository with proper Actions permissions for GHCR',
    schema: {
      input: {
        type: 'object',
        required: ['repoUrl'],
        properties: {
          repoUrl: {
            title: 'Repository URL',
            description: 'The GitHub repository URL in format github.com?owner=<owner>&repo=<repo>',
            type: 'string',
          },
          token: {
            title: 'GitHub Token',
            description: 'GitHub token with repo and packages scope (optional, uses integrations if not provided)',
            type: 'string',
          },
        },
      },
    },
    async handler(ctx) {
      const { repoUrl, token } = ctx.input;

      // Parse repository URL
      const match = repoUrl.match(/github\.com\?.*owner=([^&]+).*repo=([^&]+)/);
      if (!match) {
        throw new Error(`Invalid repoUrl format: ${repoUrl}. Expected format: github.com?owner=<owner>&repo=<repo>`);
      }

      const [, owner, repo] = match;
      ctx.logger.info(`Configuring repository: ${owner}/${repo}`);

      // Get GitHub token from input, options, or integration (in order of precedence)
      const githubToken = token || options?.token || ctx.secrets?.githubToken;
      if (!githubToken) {
        throw new Error('No GitHub token available. Please provide a token or configure GitHub integration.');
      }

      const octokit = new Octokit({ auth: githubToken });

      try {
        // Set workflow permissions to 'write' (enables GHCR push)
        ctx.logger.info('Setting workflow permissions to "write"...');
        await octokit.request('PUT /repos/{owner}/{repo}/actions/permissions/workflow', {
          owner,
          repo,
          default_workflow_permissions: 'write',
          can_approve_pull_request_reviews: true,
        });
        ctx.logger.info('✓ Workflow permissions set to "write"');

        // Ensure Actions are enabled
        ctx.logger.info('Ensuring GitHub Actions are enabled...');
        await octokit.request('PUT /repos/{owner}/{repo}/actions/permissions', {
          owner,
          repo,
          enabled: true,
          allowed_actions: 'all',
        });
        ctx.logger.info('✓ GitHub Actions enabled');

        // Get GITOPS_TOKEN from environment or Key Vault
        const gitopsToken = process.env.ARGOCD_GITHUB_PAT;
        if (gitopsToken) {
          ctx.logger.info('Adding GITOPS_TOKEN secret...');

          // Create repository secret for GitOps workflow
          // Note: Requires sodium library for encryption
          const sodium = require('libsodium-wrappers');
          await sodium.ready;

          // Get repository public key for encrypting secrets
          const { data: publicKey } = await octokit.request('GET /repos/{owner}/{repo}/actions/secrets/public-key', {
            owner,
            repo,
          });

          // Encrypt the secret value
          const messageBytes = Buffer.from(gitopsToken);
          const keyBytes = Buffer.from(publicKey.key, 'base64');
          const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
          const encryptedValue = Buffer.from(encryptedBytes).toString('base64');

          // Create or update the secret
          await octokit.request('PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}', {
            owner,
            repo,
            secret_name: 'GITOPS_TOKEN',
            encrypted_value: encryptedValue,
            key_id: publicKey.key_id,
          });

          ctx.logger.info('✓ GITOPS_TOKEN secret added');
        } else {
          ctx.logger.warn('⚠ ARGOCD_GITHUB_PAT environment variable not set - GITOPS_TOKEN secret not added');
        }

        ctx.logger.info(`✅ Repository ${owner}/${repo} configured successfully!`);
        ctx.output('configured', true);
        ctx.output('repository', `${owner}/${repo}`);

      } catch (error: any) {
        ctx.logger.error(`Failed to configure repository: ${error.message}`);
        throw new Error(`Failed to configure GitHub repository: ${error.message}`);
      }
    },
  });
};
