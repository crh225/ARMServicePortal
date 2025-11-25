/**
 * Result Pattern Implementation
 * Represents the outcome of an operation that can succeed or fail
 * Inspired by Railway Oriented Programming (F#) and Result<T> in C#
 *
 * Usage:
 * - Success: Result.success(value)
 * - Failure: Result.failure(error)
 * - Check: result.isSuccess, result.isFailure
 * - Get value: result.value (throws if failure)
 * - Get error: result.error (null if success)
 */
export class Result {
  constructor(isSuccess, value, error) {
    if (isSuccess && error) {
      throw new Error("Invalid operation: A result cannot be successful and contain an error");
    }
    if (!isSuccess && !error) {
      throw new Error("Invalid operation: A failing result must contain an error");
    }

    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
    Object.freeze(this);
  }

  /**
   * Create a successful result
   * @param {*} value - The success value
   * @returns {Result}
   */
  static success(value) {
    return new Result(true, value, null);
  }

  /**
   * Create a failed result
   * @param {string|Error} error - The error message or Error object
   * @returns {Result}
   */
  static failure(error) {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    return new Result(false, null, errorObj);
  }

  /**
   * Create a failed result with validation errors
   * @param {Array} errors - Array of validation errors
   * @returns {Result}
   */
  static validationFailure(errors) {
    const error = new Error("Validation failed");
    error.validationErrors = errors;
    error.status = 400;
    return new Result(false, null, error);
  }

  /**
   * Create a not found result
   * @param {string} message - The not found message
   * @returns {Result}
   */
  static notFound(message = "Resource not found") {
    const error = new Error(message);
    error.status = 404;
    return new Result(false, null, error);
  }

  /**
   * Check if result is successful
   * @returns {boolean}
   */
  get isSuccess() {
    return this._isSuccess;
  }

  /**
   * Check if result is failure
   * @returns {boolean}
   */
  get isFailure() {
    return !this._isSuccess;
  }

  /**
   * Get the value (throws if failure)
   * @returns {*}
   */
  get value() {
    if (!this._isSuccess) {
      throw new Error("Cannot get value from a failed result");
    }
    return this._value;
  }

  /**
   * Get the error (null if success)
   * @returns {Error|null}
   */
  get error() {
    return this._error;
  }

  /**
   * Map the value if successful
   * @param {Function} fn - Mapping function
   * @returns {Result}
   */
  map(fn) {
    if (this._isSuccess) {
      try {
        return Result.success(fn(this._value));
      } catch (error) {
        return Result.failure(error);
      }
    }
    return this;
  }

  /**
   * Bind (flatMap) for chaining operations that return Results
   * @param {Function} fn - Function that returns a Result
   * @returns {Result}
   */
  bind(fn) {
    if (this._isSuccess) {
      try {
        return fn(this._value);
      } catch (error) {
        return Result.failure(error);
      }
    }
    return this;
  }

  /**
   * Execute a function if result is failure
   * @param {Function} fn - Function to execute with error
   * @returns {Result}
   */
  onFailure(fn) {
    if (!this._isSuccess) {
      fn(this._error);
    }
    return this;
  }

  /**
   * Execute a function if result is success
   * @param {Function} fn - Function to execute with value
   * @returns {Result}
   */
  onSuccess(fn) {
    if (this._isSuccess) {
      fn(this._value);
    }
    return this;
  }

  /**
   * Match pattern - execute different functions based on success/failure
   * @param {Function} successFn - Function to execute on success
   * @param {Function} failureFn - Function to execute on failure
   * @returns {*} Result of the executed function
   */
  match(successFn, failureFn) {
    return this._isSuccess ? successFn(this._value) : failureFn(this._error);
  }

  /**
   * Convert to plain object for serialization
   * @returns {Object}
   */
  toObject() {
    return {
      isSuccess: this._isSuccess,
      value: this._value,
      error: this._error ? {
        message: this._error.message,
        status: this._error.status,
        validationErrors: this._error.validationErrors
      } : null
    };
  }
}
