/**
 * Redis Notification Repository
 * Implements INotificationRepository using Redis for persistent storage
 */
import { v4 as uuidv4 } from 'uuid';
import { INotificationRepository } from "../../../domain/repositories/INotificationRepository.js";
import { Notification } from "../../../domain/entities/Notification.js";
import redisClient from "../../utils/RedisClient.js";

const KEY_PREFIX = "armportal:notifications:";
const LIST_KEY = "armportal:notifications:list";
const MAX_NOTIFICATIONS = 100;

export class RedisNotificationRepository extends INotificationRepository {
  constructor() {
    super();
  }

  /**
   * Get Redis client or null if not available
   */
  _getRedis() {
    return redisClient.get();
  }

  async add(notificationData) {
    const notification = new Notification({
      id: uuidv4(),
      ...notificationData,
      timestamp: notificationData.timestamp || new Date()
    });

    const redis = this._getRedis();
    if (redis) {
      try {
        // Store the notification data
        const key = KEY_PREFIX + notification.id;
        await redis.setex(key, 86400 * 7, JSON.stringify(notification.toJSON())); // 7 day TTL

        // Add to the list (most recent first)
        await redis.lpush(LIST_KEY, notification.id);

        // Trim the list to max size
        await redis.ltrim(LIST_KEY, 0, MAX_NOTIFICATIONS - 1);

        console.log(`[RedisNotificationRepo] Added notification: ${notification.id}`);
      } catch (error) {
        console.error("[RedisNotificationRepo] Failed to add notification:", error.message);
      }
    }

    return notification;
  }

  async getAll(options = {}) {
    const { limit = 50, unreadOnly = false } = options;

    const redis = this._getRedis();
    if (!redis) {
      return [];
    }

    try {
      // Get notification IDs from the list
      const ids = await redis.lrange(LIST_KEY, 0, MAX_NOTIFICATIONS - 1);

      if (ids.length === 0) {
        return [];
      }

      // Get all notification data
      const keys = ids.map(id => KEY_PREFIX + id);
      const data = await redis.mget(keys);

      // Parse and filter
      const notifications = data
        .filter(d => d !== null)
        .map(d => {
          try {
            const parsed = JSON.parse(d);
            return new Notification(parsed);
          } catch {
            return null;
          }
        })
        .filter(n => n !== null);

      // Apply unread filter if needed
      let filtered = notifications;
      if (unreadOnly) {
        filtered = notifications.filter(n => !n.read);
      }

      return filtered.slice(0, limit);
    } catch (error) {
      console.error("[RedisNotificationRepo] Failed to get notifications:", error.message);
      return [];
    }
  }

  async getById(id) {
    const redis = this._getRedis();
    if (!redis) {
      return null;
    }

    try {
      const data = await redis.get(KEY_PREFIX + id);
      if (data) {
        return new Notification(JSON.parse(data));
      }
      return null;
    } catch (error) {
      console.error("[RedisNotificationRepo] Failed to get notification:", error.message);
      return null;
    }
  }

  async markAsRead(id) {
    const redis = this._getRedis();
    if (!redis) {
      return null;
    }

    try {
      const notification = await this.getById(id);
      if (notification) {
        notification.markAsRead();
        const key = KEY_PREFIX + id;
        const ttl = await redis.ttl(key);
        await redis.setex(key, ttl > 0 ? ttl : 86400, JSON.stringify(notification.toJSON()));
        return notification;
      }
      return null;
    } catch (error) {
      console.error("[RedisNotificationRepo] Failed to mark as read:", error.message);
      return null;
    }
  }

  async markAllAsRead() {
    const redis = this._getRedis();
    if (!redis) {
      return 0;
    }

    try {
      const notifications = await this.getAll({ limit: MAX_NOTIFICATIONS });
      let count = 0;

      for (const notification of notifications) {
        if (!notification.read) {
          await this.markAsRead(notification.id);
          count++;
        }
      }

      return count;
    } catch (error) {
      console.error("[RedisNotificationRepo] Failed to mark all as read:", error.message);
      return 0;
    }
  }

  async delete(id) {
    const redis = this._getRedis();
    if (!redis) {
      return false;
    }

    try {
      // Remove from the list
      await redis.lrem(LIST_KEY, 0, id);
      // Delete the data
      await redis.del(KEY_PREFIX + id);
      return true;
    } catch (error) {
      console.error("[RedisNotificationRepo] Failed to delete:", error.message);
      return false;
    }
  }

  async deleteAll() {
    const redis = this._getRedis();
    if (!redis) {
      return 0;
    }

    try {
      // Get all IDs
      const ids = await redis.lrange(LIST_KEY, 0, -1);

      if (ids.length > 0) {
        // Delete all notification data
        const keys = ids.map(id => KEY_PREFIX + id);
        await redis.del(...keys);
      }

      // Clear the list
      await redis.del(LIST_KEY);

      return ids.length;
    } catch (error) {
      console.error("[RedisNotificationRepo] Failed to delete all:", error.message);
      return 0;
    }
  }

  getUnreadCount() {
    // This is called synchronously, so we need to handle it differently
    // Return a promise that can be awaited
    return this._getUnreadCountAsync();
  }

  async _getUnreadCountAsync() {
    const notifications = await this.getAll({ limit: MAX_NOTIFICATIONS });
    return notifications.filter(n => !n.read).length;
  }
}
