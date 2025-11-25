/**
 * User Context Middleware
 * Extracts user information from authenticated requests and attaches it to req
 * This runs early in the middleware chain, before authentication
 */

export function userContext(req, res, next) {
  // Try to extract user from Authorization header (if auth middleware runs before this)
  // We'll populate this later after auth, but initialize it here
  req.userContext = null;

  // Continue to next middleware
  next();
}

/**
 * User Context Enrichment Middleware
 * Should run AFTER authentication middleware to capture user info
 */
export function enrichUserContext(req, res, next) {
  // If user was attached by auth middleware, add it to context
  if (req.user) {
    req.userContext = {
      userId: req.user.id,
      username: req.user.login,
      name: req.user.name
    };
  }

  next();
}
