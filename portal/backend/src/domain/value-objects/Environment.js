/**
 * Environment Value Object
 * Represents a deployment environment (dev, qa, staging, prod)
 */
export class Environment {
  static VALID_ENVIRONMENTS = ['dev', 'qa', 'staging', 'prod'];

  constructor(value) {
    if (!Environment.VALID_ENVIRONMENTS.includes(value)) {
      throw new Error(`Invalid environment: ${value}. Must be one of: ${Environment.VALID_ENVIRONMENTS.join(', ')}`);
    }
    this._value = value;
  }

  get value() {
    return this._value;
  }

  equals(other) {
    return other instanceof Environment && other.value === this.value;
  }

  toString() {
    return this.value;
  }

  static dev() {
    return new Environment('dev');
  }

  static qa() {
    return new Environment('qa');
  }

  static staging() {
    return new Environment('staging');
  }

  static prod() {
    return new Environment('prod');
  }

  static all() {
    return Environment.VALID_ENVIRONMENTS.map(env => new Environment(env));
  }
}
