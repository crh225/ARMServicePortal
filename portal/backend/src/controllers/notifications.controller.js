/**
 * Notifications Controller
 * Error handling, validation, and logging are handled by pipeline behaviors
 * Note: addNotification is exported for backward compatibility with webhooks
 */
import { asyncHandler } from "../middleware/asyncHandler.js";
import { GetNotificationsQuery } from "../application/notification/queries/GetNotificationsQuery.js";
import { GetNotificationByIdQuery } from "../application/notification/queries/GetNotificationByIdQuery.js";
import { AddNotificationCommand } from "../application/notification/commands/AddNotificationCommand.js";
import { MarkNotificationAsReadCommand } from "../application/notification/commands/MarkNotificationAsReadCommand.js";
import { MarkAllNotificationsAsReadCommand } from "../application/notification/commands/MarkAllNotificationsAsReadCommand.js";
import { DeleteNotificationCommand } from "../application/notification/commands/DeleteNotificationCommand.js";
import { DeleteAllNotificationsCommand } from "../application/notification/commands/DeleteAllNotificationsCommand.js";
import { mediator } from "../infrastructure/di/mediatorContainer.js";

// Singleton repository instance for backward compatibility
let repositoryInstance = null;

export function addNotification(data) {
  if (!repositoryInstance) {
    // Lazy load to avoid circular dependency
    const { InMemoryNotificationRepository } = require('../infrastructure/persistence/repositories/InMemoryNotificationRepository.js');
    repositoryInstance = new InMemoryNotificationRepository();
  }
  // Synchronous wrapper for backward compatibility
  const notification = repositoryInstance.add(data);
  return notification.then(n => n.toDTO());
}

export function createGetNotificationsHandler(mediatorInstance) {
  return asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const unreadOnly = req.query.unread === 'true';

    const query = new GetNotificationsQuery({ limit, unreadOnly });
    const result = await mediatorInstance.send(query);
    return res.json(result);
  });
}

export function createGetNotificationByIdHandler(mediatorInstance) {
  return asyncHandler(async (req, res) => {
    const query = new GetNotificationByIdQuery(req.params.id);
    const notification = await mediatorInstance.send(query);
    return res.json(notification);
  });
}

export function createMarkNotificationAsReadHandler(mediatorInstance) {
  return asyncHandler(async (req, res) => {
    const command = new MarkNotificationAsReadCommand(req.params.id);
    const notification = await mediatorInstance.send(command);
    return res.json(notification);
  });
}

export function createMarkAllNotificationsAsReadHandler(mediatorInstance) {
  return asyncHandler(async (req, res) => {
    const command = new MarkAllNotificationsAsReadCommand();
    const result = await mediatorInstance.send(command);
    return res.json(result);
  });
}

export function createDeleteNotificationHandler(mediatorInstance) {
  return asyncHandler(async (req, res) => {
    const command = new DeleteNotificationCommand(req.params.id);
    const result = await mediatorInstance.send(command);
    return res.json(result);
  });
}

export function createClearAllNotificationsHandler(mediatorInstance) {
  return asyncHandler(async (req, res) => {
    const command = new DeleteAllNotificationsCommand();
    const result = await mediatorInstance.send(command);
    return res.json(result);
  });
}
