/**
 * Global error handling middleware
 * Catches any unhandled errors and returns a consistent error response
 */
export function errorHandler(err, req, res, next) {
  console.error("[Error Handler]", err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  // Build response object with all available error properties
  const response = {
    error: message
  };

  // Add validation errors if present
  if (err.errors) {
    response.errors = err.errors;
  }

  // Add policy errors if present
  if (err.policyErrors) {
    response.policyErrors = err.policyErrors;
  }

  // Add policy warnings if present
  if (err.policyWarnings) {
    response.policyWarnings = err.policyWarnings;
  }

  // Add stack trace in development mode
  if (process.env.NODE_ENV === "development" && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
