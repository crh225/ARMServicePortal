import { describe, it, expect } from 'vitest';
import { GenerateTerraformCodeQueryValidator } from '../../../src/application/terraform/validators/GenerateTerraformCodeQueryValidator.js';
import { GenerateTerraformCodeQuery } from '../../../src/application/terraform/queries/GenerateTerraformCodeQuery.js';

describe('GenerateTerraformCodeQueryValidator', () => {
  const validator = new GenerateTerraformCodeQueryValidator();

  describe('valid resource IDs', () => {
    it('passes validation for valid Azure resource ID', () => {
      const query = new GenerateTerraformCodeQuery(
        '/subscriptions/12345/resourceGroups/my-rg/providers/Microsoft.Storage/storageAccounts/mystorage'
      );

      const result = validator.validate(query);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('passes validation for resource group ID', () => {
      const query = new GenerateTerraformCodeQuery(
        '/subscriptions/12345/resourceGroups/my-rg'
      );

      const result = validator.validate(query);

      expect(result.isValid).toBe(true);
    });

    it('passes validation for deeply nested resource', () => {
      const query = new GenerateTerraformCodeQuery(
        '/subscriptions/12345/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet/subnets/subnet1'
      );

      const result = validator.validate(query);

      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid resource IDs', () => {
    it('fails when resourceId is missing', () => {
      const query = { };

      const result = validator.validate(query);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'resourceId',
        message: 'Resource ID is required'
      });
    });

    it('fails when resourceId is null', () => {
      const query = { resourceId: null };

      const result = validator.validate(query);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'resourceId',
        message: 'Resource ID is required'
      });
    });

    it('fails when resourceId is not a string', () => {
      const query = { resourceId: 12345 };

      const result = validator.validate(query);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'resourceId',
        message: 'Resource ID must be a string'
      });
    });

    it('fails when resourceId does not start with /subscriptions/', () => {
      const query = new GenerateTerraformCodeQuery('/invalid/resource/path');

      const result = validator.validate(query);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'resourceId',
        message: 'Resource ID must be a valid Azure resource ID (starting with /subscriptions/)'
      });
    });

    it('fails for empty string', () => {
      const query = { resourceId: '' };

      const result = validator.validate(query);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'resourceId',
        message: 'Resource ID is required'
      });
    });
  });

  describe('edge cases', () => {
    it('handles resource ID with special characters', () => {
      const query = new GenerateTerraformCodeQuery(
        '/subscriptions/12345/resourceGroups/my-rg_test.prod/providers/Microsoft.Storage/storageAccounts/storage-123'
      );

      const result = validator.validate(query);

      expect(result.isValid).toBe(true);
    });

    it('handles whitespace-only string as invalid', () => {
      const query = { resourceId: '   ' };

      const result = validator.validate(query);

      expect(result.isValid).toBe(false);
    });
  });
});
