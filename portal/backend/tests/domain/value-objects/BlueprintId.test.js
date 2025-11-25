import { describe, it, expect } from 'vitest';
import { BlueprintId } from '../../../src/domain/value-objects/BlueprintId.js';

describe('BlueprintId', () => {
  it('creates a blueprint ID with valid value', () => {
    const id = new BlueprintId('azure-storage-basic');

    expect(id.value).toBe('azure-storage-basic');
  });

  it('throws if blueprint ID is null or undefined', () => {
    expect(() => new BlueprintId(null)).toThrow('Blueprint ID must be a non-empty string');
    expect(() => new BlueprintId(undefined)).toThrow('Blueprint ID must be a non-empty string');
  });

  it('throws if blueprint ID is empty string', () => {
    expect(() => new BlueprintId('')).toThrow('Blueprint ID must be a non-empty string');
  });

  it('throws if not a string', () => {
    expect(() => new BlueprintId(123)).toThrow('Blueprint ID must be a non-empty string');
  });

  it('supports equality comparison', () => {
    const id1 = new BlueprintId('azure-storage');
    const id2 = new BlueprintId('azure-storage');
    const id3 = new BlueprintId('azure-vm');

    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });

  it('returns false when comparing with non-BlueprintId', () => {
    const id = new BlueprintId('test');

    expect(id.equals({ value: 'test' })).toBe(false);
    expect(id.equals('test')).toBe(false);
  });
});
