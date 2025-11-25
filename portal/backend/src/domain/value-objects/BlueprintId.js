/**
 * Blueprint ID Value Object
 * Ensures blueprint IDs are valid strings
 */
export class BlueprintId {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('Blueprint ID must be a non-empty string');
    }
    this._value = value;
  }

  get value() {
    return this._value;
  }

  equals(other) {
    return other instanceof BlueprintId && this._value === other._value;
  }
}
