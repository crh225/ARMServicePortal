import crypto from "crypto";

// (replace with Redis/DB in production)
const sessions = new Map();

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

  // Store state in session (expires in 10 minutes)
  sessions.set(state, { createdAt: Date.now() });

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
  const storedState = sessions.get(state);
  if (!storedState) {
    return res.status(400).json({ error: "Invalid or expired state" });
  }

  // Check if state is expired (10 minutes)
  if (Date.now() - storedState.createdAt > 10 * 60 * 1000) {
    sessions.delete(state);
    return res.status(400).json({ error: "State expired" });
  }

  sessions.delete(state); // Clean up used state

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

    // Store session (expires in 7 days)
    sessions.set(sessionToken, {
      accessToken,
      user: {
        id: userData.id,
        login: userData.login,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url
      },
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
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
  const session = sessions.get(token);

  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  // Check if session is expired
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return res.status(401).json({ error: "Session expired" });
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
    sessions.delete(token);
  }

  res.json({ success: true });
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized - Please Login via Admin tab" });
  }

  const token = authHeader.substring(7);
  const session = sessions.get(token);

  if (!session || Date.now() > session.expiresAt) {
    if (session) sessions.delete(token);
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  // Attach user and access token to request
  req.user = session.user;
  req.githubAccessToken = session.accessToken;

  next();
}
