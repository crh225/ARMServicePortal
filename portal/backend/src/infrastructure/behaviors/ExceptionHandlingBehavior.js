/**
 * Exception Handling Pipeline Behavior
 * Catches and transforms exceptions into consistent error responses
 */
import { IPipelineBehavior } from "../../application/contracts/IPipelineBehavior.js";
import { ValidationException } from "./ValidationBehavior.js";
import { Result } from "../../domain/common/Result.js";

export class DomainException extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "DomainException";
    this.status = statusCode;
  }
}

export class NotFoundException extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundException";
    this.status = 404;
  }
}

export class ExceptionHandlingBehavior extends IPipelineBehavior {
  async handle(request, next) {
    try {
      const response = await next();

      // If response is a Result, convert failures to exceptions for HTTP layer
      if (response instanceof Result) {
        if (response.isFailure) {
          // Convert Result failure to exception so HTTP layer can handle it
          throw response.error;
        }
        // Return the value from successful Result
        return response.value;
      }

      return response;
    } catch (error) {
      // Re-throw known exceptions (they have status codes)
      if (error.status) {
        throw error;
      }

      // Transform policy validation errors
      if (error.policyErrors || error.policyWarnings) {
        const domainError = new DomainException(error.message || "Policy validation failed", 400);
        domainError.policyErrors = error.policyErrors;
        domainError.policyWarnings = error.policyWarnings;
        throw domainError;
      }

      // Log unexpected errors
      console.error(`[ExceptionHandlingBehavior] Unexpected error in ${request.constructor.name}:`, {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // Wrap unexpected errors
      const wrappedError = new Error("An unexpected error occurred");
      wrappedError.status = 500;
      wrappedError.originalError = error.message;
      wrappedError.stack = process.env.NODE_ENV === "development" ? error.stack : undefined;

      throw wrappedError;
    }
  }
}
