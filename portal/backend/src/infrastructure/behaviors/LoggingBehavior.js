/**
 * Logging Pipeline Behavior
 * Logs all requests and their execution time
 */
import { IPipelineBehavior } from "../../application/contracts/IPipelineBehavior.js";

export class LoggingBehavior extends IPipelineBehavior {
  async handle(request, next) {
    const requestName = request.constructor.name;
    const startTime = Date.now();

    console.log(`[MediatR] Executing ${requestName}`, {
      timestamp: new Date().toISOString(),
      request: this.sanitizeRequest(request)
    });

    try {
      const response = await next();
      const duration = Date.now() - startTime;

      console.log(`[MediatR] Completed ${requestName}`, {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      console.error(`[MediatR] Failed ${requestName}`, {
        duration: `${duration}ms`,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  sanitizeRequest(request) {
    // Remove sensitive data from logs
    const sanitized = { ...request };

    // Remove common sensitive fields
    if (sanitized.password) delete sanitized.password;
    if (sanitized.token) delete sanitized.token;
    if (sanitized.secret) delete sanitized.secret;

    return sanitized;
  }
}
