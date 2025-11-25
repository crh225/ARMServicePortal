import { describe, it, expect, vi } from 'vitest';
import { ProvisionRequest } from '../../../src/domain/entities/ProvisionRequest.js';

describe('ProvisionRequest', () => {
  describe('constructor', () => {
    it('creates provision request with required fields', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com'
      });

      expect(request.blueprintId).toBe('azure-storage');
      expect(request.variables).toEqual({ location: 'eastus' });
      expect(request.createdBy).toBe('user@example.com');
      expect(request.status).toBe('pending');
    });

    it('defaults environment to dev if not specified', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com'
      });

      expect(request.environment).toBe('dev');
    });

    it('uses environment from constructor parameter', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        environment: 'prod',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com'
      });

      expect(request.environment).toBe('prod');
    });

    it('uses environment from variables if not in constructor', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { environment: 'qa', location: 'eastus' },
        createdBy: 'user@example.com'
      });

      expect(request.environment).toBe('qa');
    });

    it('throws error when blueprintId is missing', () => {
      expect(() => new ProvisionRequest({
        variables: { location: 'eastus' },
        createdBy: 'user@example.com'
      })).toThrow('ProvisionRequest requires blueprintId');
    });

    it('throws error when variables is missing', () => {
      expect(() => new ProvisionRequest({
        blueprintId: 'azure-storage',
        createdBy: 'user@example.com'
      })).toThrow('ProvisionRequest requires variables object');
    });

    it('throws error when variables is not an object', () => {
      expect(() => new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: 'not-an-object',
        createdBy: 'user@example.com'
      })).toThrow('ProvisionRequest requires variables object');
    });

    it('throws error when createdBy is missing', () => {
      expect(() => new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' }
      })).toThrow('ProvisionRequest requires createdBy');
    });

    it('copies variables to avoid mutation', () => {
      const originalVars = { location: 'eastus' };
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: originalVars,
        createdBy: 'user@example.com'
      });

      originalVars.location = 'westus';

      expect(request.variables.location).toBe('eastus');
    });
  });

  describe('validatePolicies', () => {
    it('stores policy validation result', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com',
        blueprint: {}
      });

      const mockPolicyService = {
        validatePolicies: vi.fn().mockReturnValue({
          valid: true,
          errors: [],
          warnings: [],
          autoFilled: {}
        })
      };

      request.validatePolicies(mockPolicyService);

      expect(request.policyValidation).toBeDefined();
      expect(request.policyValidation.valid).toBe(true);
    });

    it('throws error when blueprint is not set', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com'
      });

      const mockPolicyService = { validatePolicies: vi.fn() };

      expect(() => request.validatePolicies(mockPolicyService))
        .toThrow('Blueprint must be set before policy validation');
    });

    it('throws policy error when validation fails', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com',
        blueprint: {}
      });

      const mockPolicyService = {
        validatePolicies: vi.fn().mockReturnValue({
          valid: false,
          errors: [{ field: 'location', message: 'Invalid location' }],
          warnings: []
        })
      };

      expect(() => request.validatePolicies(mockPolicyService)).toThrow('Policy validation failed');
    });

    it('sets status to policy_failed when validation fails', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com',
        blueprint: {}
      });

      const mockPolicyService = {
        validatePolicies: vi.fn().mockReturnValue({
          valid: false,
          errors: [{ field: 'location', message: 'Invalid location' }],
          warnings: []
        })
      };

      try {
        request.validatePolicies(mockPolicyService);
      } catch (error) {
        expect(request.status).toBe('policy_failed');
        expect(error.policyErrors).toBeDefined();
      }
    });
  });

  describe('applyAutoFill', () => {
    it('applies auto-filled values', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com',
        blueprint: {}
      });

      request.policyValidation = {
        valid: true,
        autoFilled: { tags: { environment: 'dev' } }
      };

      const mockPolicyService = {
        applyAutoFill: vi.fn().mockReturnValue({
          location: 'eastus',
          tags: { environment: 'dev' }
        })
      };

      const result = request.applyAutoFill(mockPolicyService);

      expect(result.tags).toEqual({ environment: 'dev' });
      expect(request.finalVariables).toBeDefined();
    });

    it('throws error when validatePolicies not called first', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com'
      });

      const mockPolicyService = { applyAutoFill: vi.fn() };

      expect(() => request.applyAutoFill(mockPolicyService))
        .toThrow('Must run validatePolicies before applyAutoFill');
    });
  });

  describe('markAsSubmitted', () => {
    it('updates status to submitted', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com'
      });

      request.markAsSubmitted({
        pullRequestUrl: 'https://github.com/org/repo/pull/1',
        branchName: 'env/dev/azure-storage',
        filePath: 'env/dev/storage.tf'
      });

      expect(request.status).toBe('submitted');
      expect(request.pullRequestUrl).toBe('https://github.com/org/repo/pull/1');
      expect(request.branchName).toBe('env/dev/azure-storage');
      expect(request.filePath).toBe('env/dev/storage.tf');
      expect(request.submittedAt).toBeDefined();
    });

    it('raises BlueprintProvisionedEvent domain event', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com'
      });

      request.markAsSubmitted({
        pullRequestUrl: 'https://github.com/org/repo/pull/1',
        branchName: 'env/dev/azure-storage',
        filePath: 'env/dev/storage.tf'
      });

      const events = request.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].constructor.name).toBe('BlueprintProvisionedEvent');
    });
  });

  describe('toResult', () => {
    it('returns result object with basic info', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com'
      });

      request.markAsSubmitted({
        pullRequestUrl: 'https://github.com/org/repo/pull/1',
        branchName: 'env/dev/azure-storage',
        filePath: 'env/dev/storage.tf'
      });

      const result = request.toResult();

      expect(result.status).toBe('submitted');
      expect(result.pullRequestUrl).toBe('https://github.com/org/repo/pull/1');
    });

    it('includes policy warnings when present', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com'
      });

      request.policyValidation = {
        valid: true,
        warnings: [{ field: 'name', message: 'Consider using naming convention' }]
      };

      const result = request.toResult();

      expect(result.policyWarnings).toBeDefined();
      expect(result.policyWarnings).toHaveLength(1);
    });

    it('excludes policy warnings when empty', () => {
      const request = new ProvisionRequest({
        blueprintId: 'azure-storage',
        variables: { location: 'eastus' },
        createdBy: 'user@example.com'
      });

      request.policyValidation = {
        valid: true,
        warnings: []
      };

      const result = request.toResult();

      expect(result.policyWarnings).toBeUndefined();
    });
  });
});
