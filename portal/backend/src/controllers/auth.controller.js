import crypto from "crypto";
import { getSessionRepository } from "../infrastructure/persistence/repositories/InMemorySessionRepository.js";

// Get the session repository instance
const sessionRepository = getSessionRepository();

// Session TTL constants
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes for OAuth state
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days for user sessions

/**
 * Initiate GitHub OAuth flow
 */
export async function initiateGitHubLogin(req, res) {
  const clientId = process.env.GH_OAUTH_CLIENT_ID;

  if (!clientId) {
    return res.status(500).json({ error: "GitHub OAuth not configured" });
  }

  // Generate random state for CSRF protection
  const state = crypto.randomBytes(16).toString("hex");

  // Store state in session repository (expires in 10 minutes)
  await sessionRepository.create(`state:${state}`, {
    type: "oauth_state",
    createdAt: Date.now(),
    expiresAt: Date.now() + STATE_TTL_MS
  });

  const redirectUri = `${process.env.APP_URL || "http://localhost:4000"}/api/auth/github/callback`;
  const scope = "read:user,repo"; // Permissions needed

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

  res.json({ authUrl: githubAuthUrl });
}

/**
 * Handle GitHub OAuth callback
 */
export async function handleGitHubCallback(req, res) {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).json({ error: "Missing code or state" });
  }

  // Validate state (CSRF protection)
  const storedState = await sessionRepository.get(`state:${state}`);
  if (!storedState) {
    return res.status(400).json({ error: "Invalid or expired state" });
  }

  // Clean up used state
  await sessionRepository.delete(`state:${state}`);

  const clientId = process.env.GH_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GH_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "GitHub OAuth not configured" });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description || tokenData.error });
    }

    const accessToken = tokenData.access_token;

    // Get user info from GitHub
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    const userData = await userResponse.json();

    // Create session token
    const sessionToken = crypto.randomBytes(32).toString("hex");

    // Store session via repository (expires in 7 days)
    await sessionRepository.create(sessionToken, {
      type: "user_session",
      accessToken,
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url
      },
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL_MS
    });

    // Redirect to frontend with session token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontendUrl}/auth/callback?token=${sessionToken}`);
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    res.status(500).json({ error: "Failed to authenticate with GitHub" });
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser(req, res) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized - Please Login via Admin tab" });
  }

  const token = authHeader.substring(7);
  const session = await sessionRepository.get(token);

  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  res.json({
    user: session.user,
    expiresAt: session.expiresAt
  });
}

/**
 * Logout - invalidate session
 */
export async function logout(req, res) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    await sessionRepository.delete(token);
  }

  res.json({ success: true });
}

/**
 * Middleware to require authentication
 * Supports both user sessions (Bearer token) and service accounts (X-API-Key)
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers['x-api-key'];

  // Check for service account API key (for Backstage integration)
  if (apiKey) {
    const configuredApiKey = process.env.SERVICE_API_KEY;
    if (configuredApiKey && apiKey === configuredApiKey) {
      // Service account - use the configured GitHub App for operations
      req.user = {
        id: 'backstage-service',
        login: 'backstage',
        name: 'Backstage Service Account',
        email: null,
        avatar_url: null
      };
      req.isServiceAccount = true;
      return next();
    }
    return res.status(401).json({ error: "Invalid API key" });
  }

  // Regular user session auth
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized - Please Login via Admin tab" });
  }

  const token = authHeader.substring(7);
  const session = await sessionRepository.get(token);

  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  // Attach user and access token to request
  req.user = session.user;
  req.githubAccessToken = session.accessToken;

  next();
}
