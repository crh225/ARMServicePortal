import fs from "fs";
import path from "path";

/**
 * Get GitHub App configuration from environment variables
 */
export function getGitHubConfig() {
  const {
    GH_APP_ID,
    GH_INSTALLATION_ID,
    GH_APP_PRIVATE_KEY,
    GH_APP_PRIVATE_KEY_BASE64,
    GH_APP_PRIVATE_KEY_PATH,
    GH_INFRA_OWNER,
    GH_INFRA_REPO
  } = process.env;

  let resolvedPrivateKey = GH_APP_PRIVATE_KEY;

  // Try loading from file path
  if (!resolvedPrivateKey && GH_APP_PRIVATE_KEY_PATH) {
    try {
      const keyPath = path.isAbsolute(GH_APP_PRIVATE_KEY_PATH)
        ? GH_APP_PRIVATE_KEY_PATH
        : path.join(process.cwd(), GH_APP_PRIVATE_KEY_PATH);

      resolvedPrivateKey = fs.readFileSync(keyPath, "utf8");
    } catch (err) {
      console.error(
        "[GitHub Config] Failed to read key from GH_APP_PRIVATE_KEY_PATH:",
        err
      );
    }
  }

  // Try decoding from base64
  if (!resolvedPrivateKey && GH_APP_PRIVATE_KEY_BASE64) {
    try {
      resolvedPrivateKey = Buffer.from(
        GH_APP_PRIVATE_KEY_BASE64,
        "base64"
      ).toString("utf8");
    } catch (err) {
      console.error(
        "[GitHub Config] Failed to decode GH_APP_PRIVATE_KEY_BASE64:",
        err
      );
    }
  }

  return {
    appId: GH_APP_ID,
    installationId: GH_INSTALLATION_ID,
    privateKey: resolvedPrivateKey,
    infraOwner: GH_INFRA_OWNER,
    infraRepo: GH_INFRA_REPO
  };
}
