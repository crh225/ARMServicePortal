/**
 * ResourceId Value Object
 * Represents an Azure Resource ID with parsing and validation
 */
import { parseResourceId as parse } from "../../infrastructure/external/logs/parseResourceId.js";

export class ResourceId {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('Resource ID must be a non-empty string');
    }

    const parsed = parse(value);
    if (!parsed || !parsed.resourceType) {
      throw new Error('Invalid Azure resource ID format');
    }

    this._value = value;
    this._parsed = parsed;
  }

  get value() {
    return this._value;
  }

  get subscriptionId() {
    return this._parsed.subscriptionId;
  }

  get resourceGroup() {
    return this._parsed.resourceGroup;
  }

  get resourceType() {
    return this._parsed.resourceType;
  }

  get resourceName() {
    return this._parsed.resourceName;
  }

  get category() {
    return this._parsed.category || 'unknown';
  }

  equals(other) {
    return other instanceof ResourceId && other.value === this.value;
  }

  toString() {
    return this.value;
  }
}
