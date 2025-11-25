import { describe, it, expect } from 'vitest';
import { Result } from '../../../src/domain/common/Result.js';

describe('Result', () => {
  describe('success', () => {
    it('creates a successful result with value', () => {
      const result = Result.success({ data: 'test' });

      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toEqual({ data: 'test' });
      expect(result.error).toBeNull();
    });

    it('can hold null as a value', () => {
      const result = Result.success(null);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });
  });

  describe('failure', () => {
    it('creates a failed result with error message', () => {
      const result = Result.failure('Something went wrong');

      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe('Something went wrong');
    });

    it('creates a failed result with Error object', () => {
      const error = new Error('Custom error');
      const result = Result.failure(error);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });

    it('throws when trying to access value on failure', () => {
      const result = Result.failure('Error');

      expect(() => result.value).toThrow('Cannot get value from a failed result');
    });
  });

  describe('validationFailure', () => {
    it('creates a validation failure with errors', () => {
      const errors = [
        { field: 'name', message: 'Required' },
        { field: 'email', message: 'Invalid format' }
      ];
      const result = Result.validationFailure(errors);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Validation failed');
      expect(result.error.validationErrors).toEqual(errors);
      expect(result.error.status).toBe(400);
    });
  });

  describe('notFound', () => {
    it('creates a not found result with default message', () => {
      const result = Result.notFound();

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Resource not found');
      expect(result.error.status).toBe(404);
    });

    it('creates a not found result with custom message', () => {
      const result = Result.notFound('Blueprint not found');

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Blueprint not found');
      expect(result.error.status).toBe(404);
    });
  });

  describe('map', () => {
    it('transforms the value if successful', () => {
      const result = Result.success(5);
      const mapped = result.map(x => x * 2);

      expect(mapped.isSuccess).toBe(true);
      expect(mapped.value).toBe(10);
    });

    it('does not transform if failed', () => {
      const result = Result.failure('Error');
      const mapped = result.map(x => x * 2);

      expect(mapped.isFailure).toBe(true);
      expect(mapped.error.message).toBe('Error');
    });

    it('returns failure if transformation throws', () => {
      const result = Result.success(5);
      const mapped = result.map(() => {
        throw new Error('Transform error');
      });

      expect(mapped.isFailure).toBe(true);
      expect(mapped.error.message).toBe('Transform error');
    });
  });

  describe('bind', () => {
    it('chains successful results', () => {
      const result = Result.success(5);
      const chained = result.bind(x => Result.success(x * 2));

      expect(chained.isSuccess).toBe(true);
      expect(chained.value).toBe(10);
    });

    it('short-circuits on failure', () => {
      const result = Result.failure('Error');
      const chained = result.bind(x => Result.success(x * 2));

      expect(chained.isFailure).toBe(true);
      expect(chained.error.message).toBe('Error');
    });

    it('handles failure in bound function', () => {
      const result = Result.success(5);
      const chained = result.bind(() => Result.failure('Bound error'));

      expect(chained.isFailure).toBe(true);
      expect(chained.error.message).toBe('Bound error');
    });
  });

  describe('onSuccess', () => {
    it('executes callback on success', () => {
      let called = false;
      const result = Result.success(5);

      result.onSuccess(value => {
        called = true;
        expect(value).toBe(5);
      });

      expect(called).toBe(true);
    });

    it('does not execute callback on failure', () => {
      let called = false;
      const result = Result.failure('Error');

      result.onSuccess(() => {
        called = true;
      });

      expect(called).toBe(false);
    });

    it('returns the result for chaining', () => {
      const result = Result.success(5);
      const returned = result.onSuccess(() => {});

      expect(returned).toBe(result);
    });
  });

  describe('onFailure', () => {
    it('executes callback on failure', () => {
      let called = false;
      const result = Result.failure('Error');

      result.onFailure(error => {
        called = true;
        expect(error.message).toBe('Error');
      });

      expect(called).toBe(true);
    });

    it('does not execute callback on success', () => {
      let called = false;
      const result = Result.success(5);

      result.onFailure(() => {
        called = true;
      });

      expect(called).toBe(false);
    });
  });

  describe('match', () => {
    it('executes success function when successful', () => {
      const result = Result.success(5);
      const matched = result.match(
        value => `Success: ${value}`,
        error => `Error: ${error.message}`
      );

      expect(matched).toBe('Success: 5');
    });

    it('executes failure function when failed', () => {
      const result = Result.failure('Something broke');
      const matched = result.match(
        value => `Success: ${value}`,
        error => `Error: ${error.message}`
      );

      expect(matched).toBe('Error: Something broke');
    });
  });

  describe('toObject', () => {
    it('converts successful result to object', () => {
      const result = Result.success({ data: 'test' });
      const obj = result.toObject();

      expect(obj).toEqual({
        isSuccess: true,
        value: { data: 'test' },
        error: null
      });
    });

    it('converts failed result to object', () => {
      const result = Result.failure('Error message');
      const obj = result.toObject();

      expect(obj.isSuccess).toBe(false);
      expect(obj.value).toBeNull();
      expect(obj.error.message).toBe('Error message');
    });

    it('includes validation errors in object', () => {
      const errors = [{ field: 'name', message: 'Required' }];
      const result = Result.validationFailure(errors);
      const obj = result.toObject();

      expect(obj.error.validationErrors).toEqual(errors);
      expect(obj.error.status).toBe(400);
    });
  });

  describe('immutability', () => {
    it('freezes the result object', () => {
      const result = Result.success(5);

      expect(() => {
        result.isSuccess = false;
      }).toThrow();
    });
  });

  describe('constructor validation', () => {
    it('throws if success result has error', () => {
      expect(() => {
        new Result(true, 'value', new Error('error'));
      }).toThrow('A result cannot be successful and contain an error');
    });

    it('throws if failure result has no error', () => {
      expect(() => {
        new Result(false, null, null);
      }).toThrow('A failing result must contain an error');
    });
  });
});
