/**
 * Job ID Value Object
 * Ensures job IDs are valid integers
 */
export class JobId {
  constructor(value) {
    const numValue = Number(value);
    if (!Number.isInteger(numValue) || numValue <= 0) {
      throw new Error('Job ID must be a positive integer');
    }
    this._value = numValue;
  }

  get value() {
    return this._value;
  }

  equals(other) {
    return other instanceof JobId && this._value === other._value;
  }
}
