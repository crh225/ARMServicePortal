import { describe, it, expect } from 'vitest';
import { Environment } from '../../../src/domain/value-objects/Environment.js';

describe('Environment', () => {
  describe('constructor', () => {
    it('creates environment with valid value', () => {
      const env = new Environment('dev');

      expect(env.value).toBe('dev');
    });

    it('accepts all valid environments', () => {
      const validEnvs = ['dev', 'qa', 'staging', 'prod'];

      validEnvs.forEach(envName => {
        const env = new Environment(envName);
        expect(env.value).toBe(envName);
      });
    });

    it('throws error for invalid environment', () => {
      expect(() => new Environment('invalid')).toThrow('Invalid environment: invalid');
      expect(() => new Environment('production')).toThrow('Invalid environment: production');
      expect(() => new Environment('')).toThrow('Invalid environment: ');
    });

    it('throws error for null or undefined', () => {
      expect(() => new Environment(null)).toThrow('Invalid environment');
      expect(() => new Environment(undefined)).toThrow('Invalid environment');
    });
  });

  describe('equals', () => {
    it('returns true for same environment values', () => {
      const env1 = new Environment('dev');
      const env2 = new Environment('dev');

      expect(env1.equals(env2)).toBe(true);
    });

    it('returns false for different environment values', () => {
      const env1 = new Environment('dev');
      const env2 = new Environment('prod');

      expect(env1.equals(env2)).toBe(false);
    });

    it('returns false when comparing with non-Environment object', () => {
      const env = new Environment('dev');

      expect(env.equals({ value: 'dev' })).toBe(false);
      expect(env.equals('dev')).toBe(false);
      expect(env.equals(null)).toBe(false);
    });
  });

  describe('toString', () => {
    it('returns the environment value as string', () => {
      const env = new Environment('qa');

      expect(env.toString()).toBe('qa');
    });
  });

  describe('static factory methods', () => {
    it('creates dev environment', () => {
      const env = Environment.dev();

      expect(env.value).toBe('dev');
      expect(env).toBeInstanceOf(Environment);
    });

    it('creates qa environment', () => {
      const env = Environment.qa();

      expect(env.value).toBe('qa');
      expect(env).toBeInstanceOf(Environment);
    });

    it('creates staging environment', () => {
      const env = Environment.staging();

      expect(env.value).toBe('staging');
      expect(env).toBeInstanceOf(Environment);
    });

    it('creates prod environment', () => {
      const env = Environment.prod();

      expect(env.value).toBe('prod');
      expect(env).toBeInstanceOf(Environment);
    });
  });

  describe('all', () => {
    it('returns array of all valid environments', () => {
      const allEnvs = Environment.all();

      expect(allEnvs).toHaveLength(4);
      expect(allEnvs.every(env => env instanceof Environment)).toBe(true);
      expect(allEnvs.map(e => e.value)).toEqual(['dev', 'qa', 'staging', 'prod']);
    });
  });

  describe('VALID_ENVIRONMENTS constant', () => {
    it('contains all valid environment names', () => {
      expect(Environment.VALID_ENVIRONMENTS).toEqual(['dev', 'qa', 'staging', 'prod']);
    });
  });
});
