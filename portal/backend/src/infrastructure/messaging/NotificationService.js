/**
 * Notification Service
 * Coordinates RabbitMQ message consumption, notification storage, and SSE broadcasting
 */
import { rabbitMQClient } from "./RabbitMQClient.js";
import { notificationBroadcaster } from "./NotificationBroadcaster.js";

class NotificationService {
  constructor() {
    this.notificationRepository = null;
    this.isRunning = false;
    this.exchange = "github-webhooks";
    this.queue = "notifications";
    this.routingPattern = "webhook.#";  // Matches webhook.github and any sub-patterns
  }

  /**
   * Initialize the notification service
   * @param {Object} notificationRepository - Repository for storing notifications
   * @param {Object} options - Configuration options
   */
  async initialize(notificationRepository, options = {}) {
    this.notificationRepository = notificationRepository;
    this.exchange = options.exchange || this.exchange;
    this.queue = options.queue || this.queue;
    this.routingPattern = options.routingPattern || this.routingPattern;

    const rabbitmqUrl = process.env.RABBITMQ_URL;

    if (!rabbitmqUrl) {
      console.log("[NotificationService] RABBITMQ_URL not configured - live notifications disabled");
      return false;
    }

    // Register event handler BEFORE connecting so it catches both initial and reconnect events
    // This ensures the queue setup and consumer are started even if initial connect fails
    // and succeeds on a background retry
    rabbitMQClient.on("connected", async () => {
      console.log("[NotificationService] RabbitMQ connected/reconnected - setting up consumer");
      this.isRunning = false; // Reset so we can restart consuming
      await rabbitMQClient.setupNotificationQueue(this.exchange, this.queue, this.routingPattern);
      await this.startConsuming();
    });

    // Attempt to connect to RabbitMQ
    const connected = await rabbitMQClient.connect(rabbitmqUrl);

    if (!connected) {
      console.warn("[NotificationService] Failed to connect to RabbitMQ - will retry in background");
      // Don't return false - the event handler above will set up the consumer when connection succeeds
      return true; // Return true since we've set up the handler and will connect eventually
    }

    console.log("[NotificationService] Initialized successfully");
    return true;
  }

  /**
   * Start consuming messages from RabbitMQ
   */
  async startConsuming() {
    if (this.isRunning) {
      console.log("[NotificationService] Already consuming");
      return;
    }

    await rabbitMQClient.consume(this.queue, async (message) => {
      await this.handleNotification(message);
    });

    this.isRunning = true;
    console.log("[NotificationService] Started consuming from RabbitMQ");
  }

  /**
   * Handle incoming notification from RabbitMQ
   * @param {Object} message - Notification message from RabbitMQ
   */
  async handleNotification(message) {
    try {
      console.log("[NotificationService] Processing notification:", message.title);

      // Store in repository (persists to Redis)
      if (this.notificationRepository) {
        const notification = await this.notificationRepository.add({
          type: message.type || "info",
          title: message.title,
          message: message.message,
          prNumber: message.prNumber,
          jobId: message.jobId,
          environment: message.environment,
          blueprint: message.blueprint,
          url: message.url,
          read: false,
          timestamp: message.timestamp || new Date()
        });

        console.log(`[NotificationService] Stored notification: ${notification.id}`);

        // Broadcast to connected clients via SSE (include ID from storage)
        notificationBroadcaster.broadcast({
          ...message,
          id: notification.id
        });
      } else {
        // Broadcast without storage ID
        notificationBroadcaster.broadcast(message);
      }
    } catch (error) {
      console.error("[NotificationService] Error handling notification:", error.message);
    }
  }

  /**
   * Handle SSE connection for a client
   * @param {Object} res - Express response object
   * @returns {string} Client ID
   */
  handleSSEConnection(res) {
    return notificationBroadcaster.addClient(res);
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      rabbitmq: rabbitMQClient.getStatus(),
      sse: notificationBroadcaster.getStatus(),
      isRunning: this.isRunning
    };
  }

  /**
   * Stop the service
   */
  async stop() {
    this.isRunning = false;
    await rabbitMQClient.stopConsuming(this.queue);
    notificationBroadcaster.closeAll();
    await rabbitMQClient.close();
    console.log("[NotificationService] Stopped");
  }
}

// Singleton instance
export const notificationService = new NotificationService();
export default notificationService;
