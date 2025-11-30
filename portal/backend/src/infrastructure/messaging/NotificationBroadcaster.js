/**
 * Notification Broadcaster
 * Manages SSE (Server-Sent Events) connections for real-time notifications
 */
import { EventEmitter } from "events";

class NotificationBroadcaster extends EventEmitter {
  constructor() {
    super();
    this.clients = new Map(); // clientId -> response object
    this.clientCounter = 0;
  }

  /**
   * Add a new SSE client
   * @param {Object} res - Express response object
   * @returns {string} Client ID
   */
  addClient(res) {
    const clientId = `client_${++this.clientCounter}_${Date.now()}`;

    // Setup SSE headers
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no" // Disable nginx buffering
    });

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

    // Store client
    this.clients.set(clientId, res);
    console.log(`[SSE] Client connected: ${clientId} (total: ${this.clients.size})`);

    // Handle client disconnect
    res.on("close", () => {
      this.removeClient(clientId);
    });

    // Keep connection alive with periodic heartbeat
    const heartbeatInterval = setInterval(() => {
      if (this.clients.has(clientId)) {
        res.write(`: heartbeat\n\n`);
      } else {
        clearInterval(heartbeatInterval);
      }
    }, 30000); // Every 30 seconds

    return clientId;
  }

  /**
   * Remove a client
   * @param {string} clientId - Client ID to remove
   */
  removeClient(clientId) {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId);
      console.log(`[SSE] Client disconnected: ${clientId} (total: ${this.clients.size})`);
    }
  }

  /**
   * Broadcast a notification to all connected clients
   * @param {Object} notification - Notification object
   */
  broadcast(notification) {
    if (this.clients.size === 0) {
      console.log("[SSE] No clients connected, skipping broadcast");
      return;
    }

    const eventData = JSON.stringify(notification);
    const message = `event: notification\ndata: ${eventData}\n\n`;

    let sentCount = 0;
    const failedClients = [];

    for (const [clientId, res] of this.clients) {
      try {
        res.write(message);
        sentCount++;
      } catch (error) {
        console.error(`[SSE] Failed to send to ${clientId}:`, error.message);
        failedClients.push(clientId);
      }
    }

    // Clean up failed clients
    for (const clientId of failedClients) {
      this.removeClient(clientId);
    }

    console.log(`[SSE] Broadcast notification to ${sentCount}/${this.clients.size} clients: ${notification.title || notification.type}`);
    this.emit("broadcast", { notification, sentCount });
  }

  /**
   * Send notification to a specific client
   * @param {string} clientId - Client ID
   * @param {Object} notification - Notification object
   */
  sendToClient(clientId, notification) {
    const res = this.clients.get(clientId);
    if (!res) {
      console.warn(`[SSE] Client not found: ${clientId}`);
      return false;
    }

    try {
      const eventData = JSON.stringify(notification);
      res.write(`event: notification\ndata: ${eventData}\n\n`);
      return true;
    } catch (error) {
      console.error(`[SSE] Failed to send to ${clientId}:`, error.message);
      this.removeClient(clientId);
      return false;
    }
  }

  /**
   * Get status of the broadcaster
   */
  getStatus() {
    return {
      connectedClients: this.clients.size,
      clientIds: Array.from(this.clients.keys())
    };
  }

  /**
   * Close all connections
   */
  closeAll() {
    for (const [clientId, res] of this.clients) {
      try {
        res.end();
      } catch (error) {
        // Ignore errors when closing
      }
    }
    this.clients.clear();
    console.log("[SSE] All connections closed");
  }
}

// Singleton instance
export const notificationBroadcaster = new NotificationBroadcaster();
export default notificationBroadcaster;
