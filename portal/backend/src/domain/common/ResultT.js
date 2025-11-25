import { Result } from "./Result.js";

/**
 * Typed Result for better type safety
 * Use when you want to be explicit about the value type
 */
export class ResultT extends Result {
  /**
   * Create a successful result with typed value
   * @template T
   * @param {T} value - The success value
   * @returns {ResultT<T>}
   */
  static ok(value) {
    return Result.success(value);
  }

  /**
   * Create a failed result
   * @param {string|Error} error - The error
   * @returns {ResultT}
   */
  static fail(error) {
    return Result.failure(error);
  }
}
