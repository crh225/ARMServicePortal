/**
 * Async Handler Wrapper
 * Wraps async route handlers to automatically catch errors and pass them to Express error middleware
 * This eliminates the need for try-catch blocks in every controller
 */

/**
 * Wraps an async route handler to catch errors and pass them to next()
 * @param {Function} fn - Async route handler function
 * @returns {Function} - Wrapped handler that catches errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
