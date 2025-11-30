/**
 * In-Memory Session Repository
 * Implements ISessionRepository using in-memory storage
 *
 * Note: For production, consider using Redis via the Cache utility
 * for distributed session storage across pods
 */
import { ISessionRepository } from "../../../domain/repositories/ISessionRepository.js";

export class InMemorySessionRepository extends ISessionRepository {
  constructor() {
    super();
    this.sessions = new Map();

    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired().catch(console.error);
    }, 5 * 60 * 1000);
  }

  async create(token, data) {
    this.sessions.set(token, {
      ...data,
      createdAt: data.createdAt || Date.now()
    });
  }

  async get(token) {
    const session = this.sessions.get(token);
    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  async delete(token) {
    const existed = this.sessions.has(token);
    this.sessions.delete(token);
    return existed;
  }

  async isValid(token) {
    const session = await this.get(token);
    return session !== null;
  }

  async cleanupExpired() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [token, session] of this.sessions.entries()) {
      if (session.expiresAt && now > session.expiresAt) {
        this.sessions.delete(token);
        cleanedCount++;
      }
    }

    return cleanedCount;
  }

  /**
   * Cleanup resources when shutting down
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
  }
}

// Singleton instance for the application
let instance = null;

export function getSessionRepository() {
  if (!instance) {
    instance = new InMemorySessionRepository();
  }
  return instance;
}
