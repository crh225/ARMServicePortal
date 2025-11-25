import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Mediator } from '../../../src/infrastructure/mediator/Mediator.js';
import { IRequestHandler } from '../../../src/application/contracts/IRequestHandler.js';
import { IRequest } from '../../../src/application/contracts/IRequest.js';
import { Result } from '../../../src/domain/common/Result.js';

// Test Request
class TestQuery extends IRequest {
  constructor(data) {
    super();
    this.data = data;
  }
}

// Test Handler
class TestHandler extends IRequestHandler {
  async handle(request) {
    return Result.success({ result: `Handled: ${request.data}` });
  }
}

// Test Behavior
class TestBehavior {
  async handle(request, next) {
    const result = await next();
    return result;
  }
}

describe('Mediator', () => {
  let mediator;

  beforeEach(() => {
    mediator = new Mediator();
  });

  describe('register', () => {
    it('registers a handler factory', () => {
      mediator.register('TestQuery', () => new TestHandler());

      expect(mediator.handlers.get('TestQuery')).toBeDefined();
    });

    it('overwrites existing handler registration', () => {
      const factory1 = () => new TestHandler();
      const factory2 = () => new TestHandler();

      mediator.register('TestQuery', factory1);
      mediator.register('TestQuery', factory2);

      expect(mediator.handlers.get('TestQuery')).toBe(factory2);
    });
  });

  describe('addBehavior', () => {
    it('adds a behavior to the pipeline', () => {
      const behavior = new TestBehavior();

      mediator.addBehavior(behavior);

      expect(mediator.behaviors).toContain(behavior);
    });

    it('maintains behavior order', () => {
      const behavior1 = new TestBehavior();
      const behavior2 = new TestBehavior();

      mediator.addBehavior(behavior1);
      mediator.addBehavior(behavior2);

      expect(mediator.behaviors[0]).toBe(behavior1);
      expect(mediator.behaviors[1]).toBe(behavior2);
    });
  });

  describe('send', () => {
    it('sends request to registered handler', async () => {
      mediator.register('TestQuery', () => new TestHandler());

      const request = new TestQuery('test data');
      const result = await mediator.send(request);

      expect(result.isSuccess).toBe(true);
      expect(result.value.result).toBe('Handled: test data');
    });

    it('throws error when no handler is registered', async () => {
      const request = new TestQuery('test data');

      await expect(mediator.send(request))
        .rejects.toThrow('No handler registered for request type: TestQuery');
    });

    it('executes behaviors in pipeline', async () => {
      const executionOrder = [];

      class LoggingBehavior {
        async handle(request, next) {
          executionOrder.push('before');
          const result = await next();
          executionOrder.push('after');
          return result;
        }
      }

      mediator.register('TestQuery', () => new TestHandler());
      mediator.addBehavior(new LoggingBehavior());

      const request = new TestQuery('test data');
      await mediator.send(request);

      expect(executionOrder).toEqual(['before', 'after']);
    });

    it('executes multiple behaviors in order', async () => {
      const executionOrder = [];

      class Behavior1 {
        async handle(request, next) {
          executionOrder.push('behavior1-before');
          const result = await next();
          executionOrder.push('behavior1-after');
          return result;
        }
      }

      class Behavior2 {
        async handle(request, next) {
          executionOrder.push('behavior2-before');
          const result = await next();
          executionOrder.push('behavior2-after');
          return result;
        }
      }

      mediator.register('TestQuery', () => new TestHandler());
      mediator.addBehavior(new Behavior1());
      mediator.addBehavior(new Behavior2());

      const request = new TestQuery('test data');
      await mediator.send(request);

      expect(executionOrder).toEqual([
        'behavior1-before',
        'behavior2-before',
        'behavior2-after',
        'behavior1-after'
      ]);
    });

    it('allows behaviors to modify result', async () => {
      class ModifyingBehavior {
        async handle(request, next) {
          const result = await next();
          return Result.success({ ...result.value, modified: true });
        }
      }

      mediator.register('TestQuery', () => new TestHandler());
      mediator.addBehavior(new ModifyingBehavior());

      const request = new TestQuery('test data');
      const result = await mediator.send(request);

      expect(result.value.modified).toBe(true);
    });

    it('allows behaviors to short-circuit pipeline', async () => {
      class ShortCircuitBehavior {
        async handle(request, next) {
          if (request.data === 'stop') {
            return Result.failure(new Error('Short-circuited'));
          }
          return next();
        }
      }

      mediator.register('TestQuery', () => new TestHandler());
      mediator.addBehavior(new ShortCircuitBehavior());

      const request = new TestQuery('stop');
      const result = await mediator.send(request);

      expect(result.isFailure).toBe(true);
      expect(result.error.message).toBe('Short-circuited');
    });

    it('creates new handler instance for each request', async () => {
      const instances = [];

      class TrackingHandler extends IRequestHandler {
        constructor() {
          super();
          instances.push(this);
        }

        async handle(request) {
          return Result.success({ data: 'ok' });
        }
      }

      mediator.register('TestQuery', () => new TrackingHandler());

      await mediator.send(new TestQuery('1'));
      await mediator.send(new TestQuery('2'));

      expect(instances.length).toBe(2);
      expect(instances[0]).not.toBe(instances[1]);
    });
  });

  describe('error handling', () => {
    it('propagates handler errors', async () => {
      class FailingHandler extends IRequestHandler {
        async handle(request) {
          throw new Error('Handler error');
        }
      }

      mediator.register('TestQuery', () => new FailingHandler());

      const request = new TestQuery('test');

      await expect(mediator.send(request)).rejects.toThrow('Handler error');
    });

    it('propagates behavior errors', async () => {
      class FailingBehavior {
        async handle(request, next) {
          throw new Error('Behavior error');
        }
      }

      mediator.register('TestQuery', () => new TestHandler());
      mediator.addBehavior(new FailingBehavior());

      const request = new TestQuery('test');

      await expect(mediator.send(request)).rejects.toThrow('Behavior error');
    });
  });
});
