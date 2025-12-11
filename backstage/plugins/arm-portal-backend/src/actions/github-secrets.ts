import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { Octokit } from '@octokit/rest';
import sodium from 'libsodium-wrappers';

/**
 * GitHub Secrets Action Configuration
 */
export interface GitHubSecretsConfig {
  token: string;
  gitopsToken?: string; // Token for pushing to GitOps repo
}

/**
 * GitHub Secrets Action
 *
 * Sets repository secrets for Azure OIDC authentication.
 * Secrets are encrypted using the repository's public key before being sent to GitHub.
 */
export function createGitHubSecretsAction(config: GitHubSecretsConfig) {
  return createTemplateAction({
    id: 'github:repo:secrets',
    description: 'Sets GitHub repository secrets for Azure OIDC authentication',
    schema: {
      input: {
        type: 'object' as const,
        required: ['repoUrl'],
        properties: {
          repoUrl: {
            type: 'string' as const,
            title: 'Repository URL',
            description: 'The GitHub repository URL (e.g., github.com?owner=org&repo=name)',
          },
          secrets: {
            type: 'object' as const,
            title: 'Secrets',
            description: 'Key-value pairs of secrets to set',
            additionalProperties: {
              type: 'string' as const,
            },
          },
        },
      },
      output: {
        type: 'object' as const,
        properties: {
          secretsSet: {
            type: 'array' as const,
            items: { type: 'string' as const },
            title: 'Secrets Set',
            description: 'List of secret names that were set',
          },
        },
      },
    },
    async handler(ctx) {
      const { repoUrl, secrets } = ctx.input as {
        repoUrl: string;
        secrets?: Record<string, string>;
      };

      // Parse the repoUrl (format: github.com?owner=xxx&repo=yyy)
      const url = new URL(`https://${repoUrl}`);
      const owner = url.searchParams.get('owner');
      const repo = url.searchParams.get('repo');

      if (!owner || !repo) {
        throw new Error(`Invalid repoUrl format: ${repoUrl}. Expected github.com?owner=xxx&repo=yyy`);
      }

      ctx.logger.info(`Setting secrets for ${owner}/${repo}`);

      const octokit = new Octokit({ auth: config.token });

      // Initialize libsodium for encryption
      await sodium.ready;

      // Get the repository's public key for secret encryption
      const { data: publicKey } = await octokit.actions.getRepoPublicKey({
        owner,
        repo,
      });

      const secretsToSet = secrets || {};
      const secretsSetList: string[] = [];

      // Auto-inject GITOPS_TOKEN if configured and not already in secrets
      if (config.gitopsToken && !secretsToSet['GITOPS_TOKEN']) {
        secretsToSet['GITOPS_TOKEN'] = config.gitopsToken;
        ctx.logger.info('Auto-injecting GITOPS_TOKEN from Backstage config');
      }

      for (const [secretName, secretValue] of Object.entries(secretsToSet)) {
        ctx.logger.info(`Setting secret: ${secretName}`);

        // Encrypt the secret value using the repository's public key
        const encryptedValue = encryptSecret(secretValue, publicKey.key);

        // Create or update the secret
        await octokit.actions.createOrUpdateRepoSecret({
          owner,
          repo,
          secret_name: secretName,
          encrypted_value: encryptedValue,
          key_id: publicKey.key_id,
        });

        secretsSetList.push(secretName);
        ctx.logger.info(`Secret ${secretName} set successfully`);
      }

      ctx.output('secretsSet', secretsSetList);
      ctx.logger.info(`Successfully set ${secretsSetList.length} secrets`);
    },
  });
}

/**
 * Encrypts a secret value using the repository's public key
 * GitHub requires secrets to be encrypted using libsodium sealed boxes
 */
function encryptSecret(secret: string, publicKey: string): string {
  // Decode the public key from base64
  const keyBytes = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);

  // Encrypt the secret using sealed box
  const messageBytes = sodium.from_string(secret);
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);

  // Return as base64
  return sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);
}
