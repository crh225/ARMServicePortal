/**
 * RabbitMQ Client
 * Manages connection to RabbitMQ and handles message consumption
 */
import amqp from "amqplib";
import { EventEmitter } from "events";

class RabbitMQClient extends EventEmitter {
  constructor() {
    super();
    this.connection = null;
    this.channel = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    this.consumers = new Map();
  }

  /**
   * Connect to RabbitMQ
   * @param {string} url - AMQP connection URL
   */
  async connect(url) {
    if (!url) {
      console.log("[RabbitMQ] No RABBITMQ_URL configured - skipping connection");
      return false;
    }

    try {
      console.log("[RabbitMQ] Connecting...");
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      this.isConnected = true;
      this.reconnectAttempts = 0;

      console.log("[RabbitMQ] Connected successfully");
      this.emit("connected");

      // Handle connection events
      this.connection.on("close", () => {
        console.log("[RabbitMQ] Connection closed");
        this.isConnected = false;
        this.emit("disconnected");
        this.scheduleReconnect(url);
      });

      this.connection.on("error", (error) => {
        console.error("[RabbitMQ] Connection error:", error.message);
        this.emit("error", error);
      });

      return true;
    } catch (error) {
      console.error("[RabbitMQ] Failed to connect:", error.message);
      this.isConnected = false;
      this.scheduleReconnect(url);
      return false;
    }
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect(url) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[RabbitMQ] Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.min(this.reconnectAttempts, 5);

    console.log(`[RabbitMQ] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => this.connect(url), delay);
  }

  /**
   * Setup exchange and queue for notifications
   * @param {string} exchange - Exchange name
   * @param {string} queue - Queue name
   * @param {string} routingPattern - Routing key pattern (e.g., "workflow.*")
   */
  async setupNotificationQueue(exchange = "github-webhooks", queue = "notifications", routingPattern = "workflow.*") {
    if (!this.channel) {
      console.warn("[RabbitMQ] Cannot setup queue - not connected");
      return false;
    }

    try {
      // Declare exchange (topic for pattern matching)
      await this.channel.assertExchange(exchange, "topic", { durable: true });

      // Declare queue
      await this.channel.assertQueue(queue, { durable: true });

      // Bind queue to exchange with routing pattern
      await this.channel.bindQueue(queue, exchange, routingPattern);

      console.log(`[RabbitMQ] Setup complete - exchange: ${exchange}, queue: ${queue}, pattern: ${routingPattern}`);
      return true;
    } catch (error) {
      console.error("[RabbitMQ] Failed to setup queue:", error.message);
      return false;
    }
  }

  /**
   * Start consuming messages from a queue
   * @param {string} queue - Queue name
   * @param {Function} handler - Message handler function
   */
  async consume(queue, handler) {
    if (!this.channel) {
      console.warn("[RabbitMQ] Cannot consume - not connected");
      return null;
    }

    try {
      const { consumerTag } = await this.channel.consume(queue, async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`[RabbitMQ] Received message from ${queue}:`, content.title || content.type);

          await handler(content, msg);
          this.channel.ack(msg);
        } catch (error) {
          console.error("[RabbitMQ] Error processing message:", error.message);
          // Reject and don't requeue on parse errors
          this.channel.nack(msg, false, false);
        }
      });

      this.consumers.set(queue, consumerTag);
      console.log(`[RabbitMQ] Started consuming from queue: ${queue}`);

      return consumerTag;
    } catch (error) {
      console.error("[RabbitMQ] Failed to start consumer:", error.message);
      return null;
    }
  }

  /**
   * Stop consuming from a queue
   * @param {string} queue - Queue name
   */
  async stopConsuming(queue) {
    const consumerTag = this.consumers.get(queue);
    if (consumerTag && this.channel) {
      await this.channel.cancel(consumerTag);
      this.consumers.delete(queue);
      console.log(`[RabbitMQ] Stopped consuming from queue: ${queue}`);
    }
  }

  /**
   * Publish a message to an exchange
   * @param {string} exchange - Exchange name
   * @param {string} routingKey - Routing key
   * @param {Object} message - Message content
   */
  async publish(exchange, routingKey, message) {
    if (!this.channel) {
      console.warn("[RabbitMQ] Cannot publish - not connected");
      return false;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      this.channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        contentType: "application/json"
      });

      console.log(`[RabbitMQ] Published message to ${exchange}/${routingKey}`);
      return true;
    } catch (error) {
      console.error("[RabbitMQ] Failed to publish:", error.message);
      return false;
    }
  }

  /**
   * Close the connection
   */
  async close() {
    try {
      // Cancel all consumers
      for (const [queue, consumerTag] of this.consumers) {
        if (this.channel) {
          await this.channel.cancel(consumerTag);
        }
      }
      this.consumers.clear();

      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.isConnected = false;
      console.log("[RabbitMQ] Connection closed");
    } catch (error) {
      console.error("[RabbitMQ] Error closing connection:", error.message);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      consumers: Array.from(this.consumers.keys())
    };
  }
}

// Singleton instance
export const rabbitMQClient = new RabbitMQClient();
export default rabbitMQClient;
