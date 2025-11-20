const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Notification service for managing browser notifications and API calls
 */
class NotificationService {
  constructor() {
    this.permission = 'default';
    this.enabled = false;
    this.loadPreferences();
  }

  /**
   * Load notification preferences from localStorage
   */
  loadPreferences() {
    const prefs = localStorage.getItem('notification_preferences');
    if (prefs) {
      try {
        const parsed = JSON.parse(prefs);
        this.enabled = parsed.enabled !== false; // Default to true
      } catch (e) {
        console.error('Failed to parse notification preferences:', e);
      }
    } else {
      this.enabled = true; // Default enabled
    }
  }

  /**
   * Save notification preferences to localStorage
   */
  savePreferences() {
    localStorage.setItem('notification_preferences', JSON.stringify({
      enabled: this.enabled,
      permission: this.permission
    }));
  }

  /**
   * Request browser notification permission
   * @returns {Promise<string>} Permission status: 'granted', 'denied', or 'default'
   */
  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      this.savePreferences();
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      this.permission = 'denied';
      this.savePreferences();
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      this.savePreferences();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are supported and enabled
   * @returns {boolean}
   */
  isSupported() {
    return 'Notification' in window;
  }

  /**
   * Check if user has granted permission
   * @returns {boolean}
   */
  hasPermission() {
    return this.isSupported() && Notification.permission === 'granted';
  }

  /**
   * Enable notifications (request permission if needed)
   * @returns {Promise<boolean>} True if enabled successfully
   */
  async enable() {
    this.enabled = true;
    this.savePreferences();

    if (!this.hasPermission()) {
      const permission = await this.requestPermission();
      return permission === 'granted';
    }

    return true;
  }

  /**
   * Disable notifications
   */
  disable() {
    this.enabled = false;
    this.savePreferences();
  }

  /**
   * Show a browser notification
   * @param {object} notification - Notification data
   * @param {function} onClick - Optional click handler
   */
  showBrowserNotification(notification, onClick) {
    if (!this.enabled || !this.hasPermission()) {
      return;
    }

    const options = {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.prNumber ? `job-${notification.prNumber}` : notification.id,
      requireInteraction: false,
      badge: '/favicon.ico',
      timestamp: new Date(notification.timestamp).getTime()
    };

    try {
      const browserNotification = new Notification(notification.title, options);

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        if (onClick) {
          onClick(notification);
        }
        browserNotification.close();
      };

      // Auto-close after 8 seconds
      setTimeout(() => {
        browserNotification.close();
      }, 8000);

    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }

  /**
   * Fetch notifications from the API
   * @param {object} options - Query options
   * @returns {Promise<object>} Notifications response
   */
  async fetchNotifications(options = {}) {
    const params = new URLSearchParams();
    if (options.limit) {
      params.append('limit', options.limit);
    }
    if (options.unread) {
      params.append('unread', 'true');
    }

    const url = `${API_BASE_URL}/api/notifications${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    return response.json();
  }

  /**
   * Mark a notification as read
   * @param {string} id - Notification ID
   * @returns {Promise<object>} Response
   */
  async markAsRead(id) {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${id}/read`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }

    return response.json();
  }

  /**
   * Mark all notifications as read
   * @returns {Promise<object>} Response
   */
  async markAllAsRead() {
    const response = await fetch(`${API_BASE_URL}/api/notifications/mark-all-read`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error('Failed to mark all notifications as read');
    }

    return response.json();
  }

  /**
   * Delete a notification
   * @param {string} id - Notification ID
   * @returns {Promise<object>} Response
   */
  async deleteNotification(id) {
    const response = await fetch(`${API_BASE_URL}/api/notifications/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }

    return response.json();
  }

  /**
   * Clear all notifications
   * @returns {Promise<object>} Response
   */
  async clearAll() {
    const response = await fetch(`${API_BASE_URL}/api/notifications`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to clear notifications');
    }

    return response.json();
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService;
