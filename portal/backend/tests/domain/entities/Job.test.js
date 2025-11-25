import { describe, it, expect, beforeEach } from 'vitest';
import { Job } from '../../../src/domain/entities/Job.js';

describe('Job', () => {
  describe('constructor', () => {
    it('creates job with valid prNumber', () => {
      const job = new Job({ prNumber: 123 });

      expect(job.prNumber).toBe(123);
      expect(job.status).toBe('pending');
      expect(job.merged).toBe(false);
    });

    it('accepts "number" property instead of prNumber (GitHub format)', () => {
      const job = new Job({ number: 456 });

      expect(job.prNumber).toBe(456);
    });

    it('throws error when prNumber is missing', () => {
      expect(() => new Job({})).toThrow('Job requires valid prNumber');
    });

    it('throws error when prNumber is not an integer', () => {
      expect(() => new Job({ prNumber: 'abc' })).toThrow('Job requires valid prNumber');
      expect(() => new Job({ prNumber: 12.5 })).toThrow('Job requires valid prNumber');
      expect(() => new Job({ prNumber: null })).toThrow('Job requires valid prNumber');
    });

    it('initializes with default values', () => {
      const job = new Job({ prNumber: 1 });

      expect(job.environment).toBeNull();
      expect(job.blueprintId).toBeNull();
      expect(job.blueprintVersion).toBeNull();
      expect(job.moduleName).toBeNull();
      expect(job.createdBy).toBeNull();
      expect(job.createdAt).toBeNull();
      expect(job.merged).toBe(false);
      expect(job.mergedAt).toBeNull();
      expect(job.status).toBe('pending');
      expect(job.variables).toEqual({});
      expect(job.resources).toEqual([]);
      expect(job.workflowRuns).toEqual([]);
    });

    it('accepts optional properties', () => {
      const jobData = {
        prNumber: 1,
        environment: 'dev',
        blueprintId: 'azure-storage',
        blueprintVersion: '1.0.0',
        moduleName: 'my-storage',
        createdBy: 'user@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        merged: true,
        mergedAt: '2024-01-02T00:00:00Z',
        status: 'merged',
        variables: { location: 'eastus' },
        resources: [{ id: 'res-1' }],
        workflowRuns: [{ id: 'run-1' }]
      };

      const job = new Job(jobData);

      expect(job.environment).toBe('dev');
      expect(job.blueprintId).toBe('azure-storage');
      expect(job.blueprintVersion).toBe('1.0.0');
      expect(job.moduleName).toBe('my-storage');
      expect(job.createdBy).toBe('user@example.com');
      expect(job.createdAt).toBe('2024-01-01T00:00:00Z');
      expect(job.merged).toBe(true);
      expect(job.mergedAt).toBe('2024-01-02T00:00:00Z');
      expect(job.status).toBe('merged');
      expect(job.variables).toEqual({ location: 'eastus' });
      expect(job.resources).toEqual([{ id: 'res-1' }]);
      expect(job.workflowRuns).toEqual([{ id: 'run-1' }]);
    });
  });

  describe('canPromote', () => {
    it('returns true when job is merged and not in prod', () => {
      const job = new Job({
        prNumber: 1,
        environment: 'dev',
        merged: true
      });

      const result = job.canPromote();

      expect(result.canPromote).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('returns false when job is not merged', () => {
      const job = new Job({
        prNumber: 1,
        environment: 'dev',
        merged: false
      });

      const result = job.canPromote();

      expect(result.canPromote).toBe(false);
      expect(result.errors).toContain('Resource must be merged and deployed before promotion');
    });

    it('returns false when environment is null', () => {
      const job = new Job({
        prNumber: 1,
        merged: true
      });

      const result = job.canPromote();

      expect(result.canPromote).toBe(false);
      expect(result.errors).toContain('Source resource has no environment specified');
    });

    it('returns false when environment is prod', () => {
      const job = new Job({
        prNumber: 1,
        environment: 'prod',
        merged: true
      });

      const result = job.canPromote();

      expect(result.canPromote).toBe(false);
      expect(result.errors).toContain('Cannot promote from production - it is the final environment');
    });

    it('returns multiple errors when multiple conditions fail', () => {
      const job = new Job({
        prNumber: 1,
        merged: false
      });

      const result = job.canPromote();

      expect(result.canPromote).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('getNextEnvironment', () => {
    it('returns qa for dev environment', () => {
      const job = new Job({ prNumber: 1, environment: 'dev' });

      expect(job.getNextEnvironment()).toBe('qa');
    });

    it('returns staging for qa environment', () => {
      const job = new Job({ prNumber: 1, environment: 'qa' });

      expect(job.getNextEnvironment()).toBe('staging');
    });

    it('returns prod for staging environment', () => {
      const job = new Job({ prNumber: 1, environment: 'staging' });

      expect(job.getNextEnvironment()).toBe('prod');
    });

    it('returns null for prod environment', () => {
      const job = new Job({ prNumber: 1, environment: 'prod' });

      expect(job.getNextEnvironment()).toBeNull();
    });

    it('returns undefined for unknown environment', () => {
      const job = new Job({ prNumber: 1, environment: 'unknown' });

      expect(job.getNextEnvironment()).toBeUndefined();
    });
  });

  describe('validatePromotion', () => {
    it('returns target environment when promotion is valid', () => {
      const job = new Job({
        prNumber: 1,
        environment: 'dev',
        merged: true
      });

      const targetEnv = job.validatePromotion();

      expect(targetEnv).toBe('qa');
    });

    it('throws error when job cannot be promoted', () => {
      const job = new Job({
        prNumber: 1,
        environment: 'dev',
        merged: false
      });

      expect(() => job.validatePromotion()).toThrow('Resource must be merged and deployed before promotion');
    });

    it('throws error when promoting from prod', () => {
      const job = new Job({
        prNumber: 1,
        environment: 'prod',
        merged: true
      });

      expect(() => job.validatePromotion()).toThrow('Cannot promote from production');
    });

    it('includes error details in thrown error', () => {
      const job = new Job({
        prNumber: 1,
        environment: 'dev',
        merged: false
      });

      try {
        job.validatePromotion();
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.status).toBe(400);
        expect(error.details).toContain('Resource must be merged');
      }
    });
  });

  describe('isTerminal', () => {
    it('returns true for terminal statuses', () => {
      const terminalStatuses = ['merged', 'closed', 'failed', 'cancelled'];

      terminalStatuses.forEach(status => {
        const job = new Job({ prNumber: 1, status });
        expect(job.isTerminal()).toBe(true);
      });
    });

    it('returns false for non-terminal statuses', () => {
      const nonTerminalStatuses = ['pending', 'running'];

      nonTerminalStatuses.forEach(status => {
        const job = new Job({ prNumber: 1, status });
        expect(job.isTerminal()).toBe(false);
      });
    });
  });

  describe('isActive', () => {
    it('returns true when merged and not terminal', () => {
      const job = new Job({
        prNumber: 1,
        merged: true,
        status: 'running'
      });

      expect(job.isActive()).toBe(true);
    });

    it('returns false when not merged', () => {
      const job = new Job({
        prNumber: 1,
        merged: false,
        status: 'pending'
      });

      expect(job.isActive()).toBe(false);
    });

    it('returns false when in terminal status', () => {
      const job = new Job({
        prNumber: 1,
        merged: true,
        status: 'closed'
      });

      expect(job.isActive()).toBe(false);
    });
  });

  describe('updateStatus', () => {
    it('updates status to valid value', () => {
      const job = new Job({ prNumber: 1 });

      job.updateStatus('running');

      expect(job.status).toBe('running');
    });

    it('throws error for invalid status', () => {
      const job = new Job({ prNumber: 1 });

      expect(() => job.updateStatus('invalid')).toThrow('Invalid job status: invalid');
    });

    it('sets mergedAt when status changes to merged', () => {
      const job = new Job({ prNumber: 1 });

      job.updateStatus('merged');

      expect(job.merged).toBe(true);
      expect(job.mergedAt).toBeTruthy();
      expect(typeof job.mergedAt).toBe('string');
    });

    it('does not overwrite mergedAt if already set', () => {
      const existingMergedAt = '2024-01-01T00:00:00Z';
      const job = new Job({
        prNumber: 1,
        mergedAt: existingMergedAt
      });

      job.updateStatus('merged');

      expect(job.mergedAt).toBe(existingMergedAt);
    });
  });

  describe('addResources', () => {
    it('adds resources to job', () => {
      const job = new Job({ prNumber: 1 });
      const resources = [{ id: 'res-1' }, { id: 'res-2' }];

      job.addResources(resources);

      expect(job.resources).toEqual(resources);
    });

    it('appends to existing resources', () => {
      const job = new Job({
        prNumber: 1,
        resources: [{ id: 'res-1' }]
      });

      job.addResources([{ id: 'res-2' }]);

      expect(job.resources).toEqual([{ id: 'res-1' }, { id: 'res-2' }]);
    });

    it('throws error when resources is not an array', () => {
      const job = new Job({ prNumber: 1 });

      expect(() => job.addResources('not-array')).toThrow('Resources must be an array');
      expect(() => job.addResources({ id: 'res-1' })).toThrow('Resources must be an array');
    });
  });

  describe('addWorkflowRun', () => {
    it('adds workflow run to job', () => {
      const job = new Job({ prNumber: 1 });
      const workflowRun = { id: 'run-1', status: 'success' };

      job.addWorkflowRun(workflowRun);

      expect(job.workflowRuns).toContain(workflowRun);
    });

    it('appends to existing workflow runs', () => {
      const job = new Job({
        prNumber: 1,
        workflowRuns: [{ id: 'run-1' }]
      });

      job.addWorkflowRun({ id: 'run-2' });

      expect(job.workflowRuns).toHaveLength(2);
    });
  });

  describe('markAsDestroyed', () => {
    it('updates status to destroying', () => {
      const job = new Job({ prNumber: 1 });

      job.markAsDestroyed('https://github.com/org/repo/pull/123');

      expect(job.status).toBe('destroying');
    });

    it('stores destroy PR URL', () => {
      const job = new Job({ prNumber: 1 });
      const prUrl = 'https://github.com/org/repo/pull/123';

      job.markAsDestroyed(prUrl);

      expect(job.destroyPullRequestUrl).toBe(prUrl);
    });

    it('raises ResourceDestroyedEvent domain event', () => {
      const job = new Job({ prNumber: 1 });

      job.markAsDestroyed('https://github.com/org/repo/pull/123');

      const events = job.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].constructor.name).toBe('ResourceDestroyedEvent');
    });
  });

  describe('toDTO', () => {
    it('returns DTO with all properties', () => {
      const job = new Job({
        prNumber: 1,
        environment: 'dev',
        blueprintId: 'azure-storage',
        blueprintVersion: '1.0.0',
        moduleName: 'my-storage',
        createdBy: 'user@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        merged: true,
        mergedAt: '2024-01-02T00:00:00Z',
        status: 'merged',
        variables: { location: 'eastus' },
        resources: [{ id: 'res-1' }],
        workflowRuns: [{ id: 'run-1' }]
      });

      const dto = job.toDTO();

      expect(dto).toEqual({
        prNumber: 1,
        environment: 'dev',
        blueprintId: 'azure-storage',
        blueprintVersion: '1.0.0',
        moduleName: 'my-storage',
        createdBy: 'user@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        merged: true,
        mergedAt: '2024-01-02T00:00:00Z',
        status: 'merged',
        variables: { location: 'eastus' },
        resources: [{ id: 'res-1' }],
        workflowRuns: [{ id: 'run-1' }],
        canPromote: true,
        nextEnvironment: 'qa'
      });
    });

    it('includes computed properties canPromote and nextEnvironment', () => {
      const job = new Job({
        prNumber: 1,
        environment: 'prod',
        merged: true
      });

      const dto = job.toDTO();

      expect(dto.canPromote).toBe(false);
      expect(dto.nextEnvironment).toBeNull();
    });
  });
});
