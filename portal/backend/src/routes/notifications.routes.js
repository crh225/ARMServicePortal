/**
 * Notifications Routes
 */
import express from "express";
import { mediator } from "../infrastructure/di/mediatorContainer.js";
import { notificationService } from "../infrastructure/messaging/NotificationService.js";
import {
  createGetNotificationsHandler,
  createGetNotificationByIdHandler,
  createMarkNotificationAsReadHandler,
  createMarkAllNotificationsAsReadHandler,
  createDeleteNotificationHandler,
  createClearAllNotificationsHandler
} from "../controllers/notifications.controller.js";

const router = express.Router();

// Create handlers with mediator
const getNotificationsHandler = createGetNotificationsHandler(mediator);
const getNotificationByIdHandler = createGetNotificationByIdHandler(mediator);
const markNotificationAsReadHandler = createMarkNotificationAsReadHandler(mediator);
const markAllNotificationsAsReadHandler = createMarkAllNotificationsAsReadHandler(mediator);
const deleteNotificationHandler = createDeleteNotificationHandler(mediator);
const clearAllNotificationsHandler = createClearAllNotificationsHandler(mediator);

/**
 * GET /api/notifications
 * Get all notifications (with optional filters)
 * Query params:
 * - limit: number of notifications to return (default: 50)
 * - unread: 'true' to get only unread notifications
 */
router.get("/", getNotificationsHandler);

/**
 * GET /api/notifications/:id
 * Get a specific notification by ID
 */
router.get("/:id", getNotificationByIdHandler);

/**
 * POST /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.post("/:id/read", markNotificationAsReadHandler);

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.post("/mark-all-read", markAllNotificationsAsReadHandler);

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
router.delete("/:id", deleteNotificationHandler);

/**
 * DELETE /api/notifications
 * Clear all notifications
 */
router.delete("/", clearAllNotificationsHandler);

/**
 * GET /api/notifications/live
 * Server-Sent Events endpoint for real-time notifications
 */
router.get("/live", (req, res) => {
  console.log("[SSE] New client connecting for live notifications...");

  // Handle SSE connection
  const clientId = notificationService.handleSSEConnection(res);
  console.log(`[SSE] Client ${clientId} connected`);
});

/**
 * GET /api/notifications/status
 * Get notification service status (RabbitMQ + SSE connections)
 */
router.get("/status", (req, res) => {
  const status = notificationService.getStatus();
  res.json(status);
});

export default router;
