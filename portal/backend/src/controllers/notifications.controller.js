import { v4 as uuidv4 } from 'uuid';

// In-memory storage for notifications
// Note: This will reset when the server restarts
// For production, consider using Redis or a database
let notifications = [];
const MAX_NOTIFICATIONS = 50; // Keep only the last 50 notifications

/**
 * Add a new notification to the store
 * @param {object} data - Notification data
 * @returns {object} The created notification
 */
export function addNotification(data) {
  const notification = {
    id: uuidv4(),
    type: data.type || 'job_info',
    title: data.title,
    message: data.message,
    prNumber: data.prNumber || null,
    jobId: data.jobId || null,
    environment: data.environment || null,
    blueprint: data.blueprint || null,
    timestamp: new Date().toISOString(),
    read: false,
    url: data.url || null
  };

  // Add to beginning of array (most recent first)
  notifications.unshift(notification);

  // Trim to max size
  if (notifications.length > MAX_NOTIFICATIONS) {
    notifications = notifications.slice(0, MAX_NOTIFICATIONS);
  }

  return notification;
}

/**
 * GET /api/notifications
 * Get all recent notifications
 */
export async function getNotifications(req, res) {
  try {
    // Get query parameters
    const limit = parseInt(req.query.limit) || 50;
    const unreadOnly = req.query.unread === 'true';

    let filtered = notifications;

    // Filter by unread if requested
    if (unreadOnly) {
      filtered = notifications.filter(n => !n.read);
    }

    // Apply limit
    const result = filtered.slice(0, limit);

    res.json({
      notifications: result,
      total: filtered.length,
      unreadCount: notifications.filter(n => !n.read).length
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      error: "Failed to fetch notifications",
      details: error.message
    });
  }
}

/**
 * GET /api/notifications/:id
 * Get a specific notification
 */
export async function getNotificationById(req, res) {
  try {
    const { id } = req.params;
    const notification = notifications.find(n => n.id === id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error("Error fetching notification:", error);
    res.status(500).json({
      error: "Failed to fetch notification",
      details: error.message
    });
  }
}

/**
 * POST /api/notifications/:id/read
 * Mark a notification as read
 */
export async function markNotificationAsRead(req, res) {
  try {
    const { id } = req.params;
    const notification = notifications.find(n => n.id === id);

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    notification.read = true;

    res.json({
      success: true,
      notification
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      error: "Failed to mark notification as read",
      details: error.message
    });
  }
}

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(req, res) {
  try {
    notifications.forEach(n => {
      n.read = true;
    });

    res.json({
      success: true,
      count: notifications.length
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({
      error: "Failed to mark all notifications as read",
      details: error.message
    });
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const initialLength = notifications.length;
    notifications = notifications.filter(n => n.id !== id);

    if (notifications.length === initialLength) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({
      success: true,
      message: "Notification deleted"
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({
      error: "Failed to delete notification",
      details: error.message
    });
  }
}

/**
 * DELETE /api/notifications
 * Clear all notifications
 */
export async function clearAllNotifications(req, res) {
  try {
    const count = notifications.length;
    notifications = [];

    res.json({
      success: true,
      message: `Cleared ${count} notifications`
    });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({
      error: "Failed to clear notifications",
      details: error.message
    });
  }
}
