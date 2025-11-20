import express from "express";
import {
  getNotifications,
  getNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications
} from "../controllers/notifications.controller.js";

const router = express.Router();

/**
 * GET /api/notifications
 * Get all notifications (with optional filters)
 * Query params:
 * - limit: number of notifications to return (default: 50)
 * - unread: 'true' to get only unread notifications
 */
router.get("/", getNotifications);

/**
 * GET /api/notifications/:id
 * Get a specific notification by ID
 */
router.get("/:id", getNotificationById);

/**
 * POST /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.post("/:id/read", markNotificationAsRead);

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.post("/mark-all-read", markAllNotificationsAsRead);

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete("/:id", deleteNotification);

/**
 * DELETE /api/notifications
 * Clear all notifications
 */
router.delete("/", clearAllNotifications);

export default router;
