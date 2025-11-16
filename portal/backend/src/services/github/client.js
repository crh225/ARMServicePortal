import { App as GitHubApp } from "@octokit/app";
import { Octokit } from "@octokit/rest";
import { getGitHubConfig } from "./config.js";

/**
 * Create an authenticated Octokit client for the GitHub App installation
 */
export async function getInstallationClient() {
  const { appId, installationId, privateKey } = getGitHubConfig();

  if (!appId || !installationId || !privateKey) {
    throw new Error(
      "GitHub App configuration missing. Check env vars: " +
        "GH_APP_ID, GH_INSTALLATION_ID, and GH_APP_PRIVATE_KEY / _PATH / _BASE64"
    );
  }

  const app = new GitHubApp({
    appId,
    privateKey
  });

  const {
    data: { token }
  } = await app.octokit.request(
    "POST /app/installations/{installation_id}/access_tokens",
    {
      installation_id: installationId
    }
  );

  return new Octokit({ auth: token });
}
