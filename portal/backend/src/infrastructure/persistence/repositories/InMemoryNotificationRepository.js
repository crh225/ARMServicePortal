/**
 * In-Memory Notification Repository
 * Implements INotificationRepository using in-memory storage
 */
import { v4 as uuidv4 } from 'uuid';
import { INotificationRepository } from "../../../domain/repositories/INotificationRepository.js";
import { Notification } from "../../../domain/entities/Notification.js";

export class InMemoryNotificationRepository extends INotificationRepository {
  constructor() {
    super();
    this.notifications = [];
    this.MAX_NOTIFICATIONS = 50;
  }

  async add(notificationData) {
    const notification = new Notification({
      id: uuidv4(),
      ...notificationData
    });

    // Add to beginning (most recent first)
    this.notifications.unshift(notification);

    // Trim to max size
    if (this.notifications.length > this.MAX_NOTIFICATIONS) {
      this.notifications = this.notifications.slice(0, this.MAX_NOTIFICATIONS);
    }

    return notification;
  }

  async getAll(options = {}) {
    const { limit = 50, unreadOnly = false } = options;

    let filtered = this.notifications;

    if (unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    return filtered.slice(0, limit);
  }

  async getById(id) {
    return this.notifications.find(n => n.id === id) || null;
  }

  async markAsRead(id) {
    const notification = await this.getById(id);
    if (notification) {
      notification.markAsRead();
      return notification;
    }
    return null;
  }

  async markAllAsRead() {
    this.notifications.forEach(n => n.markAsRead());
    return this.notifications.filter(n => n.read).length;
  }

  async delete(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      return true;
    }
    return false;
  }

  async deleteAll() {
    const count = this.notifications.length;
    this.notifications = [];
    return count;
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }
}
